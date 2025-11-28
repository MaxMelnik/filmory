import { searchAllByMediaType } from '../../services/integrations/tmdbClient.js';
import { Markup } from 'telegraf';
import { FilmService } from '../../services/FilmService.js';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';

export async function handleAddFilm(ctx) {
    logger.info(`[ADD FILM SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    await UserService.getOrCreateUserFromCtx(ctx);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);
    await ctx.reply('Введи назву фільму, який хочеш додати:', keyboard);

    ctx.session = ctx.session || {};
    ctx.session.awaitingFilmTitle = true;
}

export async function handleFilmTitleInput(ctx) {
    const title = ctx.message?.text?.trim() ?? ctx.session.title;
    if (title === '/start') return ctx.scene.enter('START_SCENE_ID');
    if (title === '/add') return ctx.scene.enter('ADD_FILM_SCENE_ID');
    if (title === '/my_films') return ctx.scene.enter('LIBRARY_SCENE_ID');
    if (title === '/recommend') return ctx.scene.enter('RECOMMENDATION_SCENE_ID');
    if (title === '/plus') return ctx.scene.enter('SUBSCRIPTIONS_SCENE_ID');

    if (!ctx.session?.awaitingFilmTitle) return;

    ctx.session.title = title;
    logger.info(`Add Film by @${ctx.from.username}: ${title}`);

    const films = await searchAllByMediaType(title);
    ctx.scene.state.films = films ?? [];
    ctx.scene.state.filmIndex ??= 0;
    if (!films || !films[ctx.scene.state.filmIndex]) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`📝 Зберегти як "${title}"`, `SAVE_MANUAL`)],
            [Markup.button.callback('⬅ Назад', 'GO_BACK')],
        ]);
        return ctx.reply('Не знайшов такого фільму на TMDB 😢', keyboard);
    }
    const found = films[ctx.scene.state.filmIndex];

    const film = await FilmService.upsertFromTmdb(found);
    ctx.scene.state.film = film;

    const navButtons = (films.length > 1) ? [
        Markup.button.callback('⬅', 'PREV_FILM_SEARCH'),
        Markup.button.callback(`📄 ${ctx.scene.state.filmIndex + 1}/${films.length}`, 'FAKE_BUTTON'),
        Markup.button.callback('➡', 'NEXT_FILM_SEARCH'),
    ] : [];

    const keyboard = Markup.inlineKeyboard([
        navButtons,
        [Markup.button.callback('🎞 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback(`📝 Лише назву "${title}"`, `SAVE_MANUAL`)],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);

    const caption = `<b>${film.title}</b> (${film.year || '?'})\n\n${film.description ? `${film.description}\n\n` : ''}Як зберегти цей фільм?`;

    if (film.posterUrl) {
        await ctx.replyWithPhoto(film.posterUrl, {
            caption,
            parse_mode: 'HTML',
            ...keyboard,
        });
    } else {
        await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
    }
}
