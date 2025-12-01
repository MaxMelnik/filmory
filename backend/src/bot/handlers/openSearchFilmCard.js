import { Markup } from 'telegraf';
import { FilmService } from '../../services/FilmService.js';
import updateSearchFilmCardMessage from '../../utils/updateSearchFilmCardMessage.js';

export async function openSearchFilmCard(ctx) {
    const title = ctx.session.title;

    const films = ctx.scene.state.films;
    ctx.scene.state.filmIndex ??= 0;
    const found = films[ctx.scene.state.filmIndex];
    if (!found) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`📝 Зберегти як "${title}"`, `SAVE_MANUAL`)],
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]);
        return ctx.reply('Не знайшов такого фільму на TMDB 😢', keyboard);
    }

    const film = await FilmService.upsertFromTmdb(found);
    ctx.scene.state.film = film;

    const navButtons = (films.length > 1) ? [
        Markup.button.callback('⬅', 'PREV_FILM_SEARCH'),
        Markup.button.callback(`📄 ${ctx.scene.state.filmIndex + 1}/${films.length}`, 'FAKE_BUTTON'),
        Markup.button.callback('➡', 'NEXT_FILM_SEARCH'),
    ] : [];

    const keyboard = Markup.inlineKeyboard([
        navButtons,
        [Markup.button.callback('📼 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback(`📝 Лише назву "${title}"`, `SAVE_MANUAL`)],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);

    const caption = `<b>${film.title}</b> (${film.year || '?'})\n\n${film.description ? `${film.description}\n\n` : ''}Як зберегти цей фільм?`;

    await updateSearchFilmCardMessage(ctx, film, caption, keyboard);
}
