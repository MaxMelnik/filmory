import { searchFilm } from '../../services/integrations/tmdbClient.js';
import { Markup } from 'telegraf';
import { FilmService } from '../../services/FilmService.js';
import { UserService } from '../../services/UserService.js';

export async function handleAddFilm(ctx) {
    console.log(`[ADD FILM SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    await UserService.getOrCreateUserFromCtx(ctx);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);
    await ctx.reply('Введи назву фільму, який хочеш додати:', keyboard);

    ctx.session = ctx.session || {};
    ctx.session.awaitingFilmTitle = true;
}

export async function handleFilmTitleInput(ctx) {
    if (!ctx.session?.awaitingFilmTitle) return;

    const title = ctx.message.text.trim();
    ctx.session.awaitingFilmTitle = false;
    ctx.session.title = title;
    console.log(`Add Film by @${ctx.from.username}: ${title}`);

    const found = await searchFilm(title);
    if (!found) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`📝 Зберегти як "${title}"`, `SAVE_MANUAL`)],
            [Markup.button.callback('⬅ Назад', 'GO_BACK')],
        ]);
        return ctx.reply('Не знайшов такого фільму на TMDB 😢', keyboard);
    }

    const film = await FilmService.upsertFromTmdb(found);
    ctx.scene.state.film = film;

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🎞 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback(`📝 Зберегти як "${title}"`, `SAVE_MANUAL`)],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);

    const caption = `<b>${film.title}</b> (${film.year || '?'})\n\nЩо зробимо з цим фільмом?`;

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
