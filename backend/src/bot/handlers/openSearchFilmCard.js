import { Markup } from 'telegraf';
import { FilmService } from '../../services/FilmService.js';
import updateSearchFilmCardMessage from '../../utils/updateSearchFilmCardMessage.js';
import { getMovieDetails } from '../../services/integrations/tmdbClient.js';
import { UserService } from '../../services/UserService.js';
import { LibraryService } from '../../services/LibraryService.js';

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

    const details = await getMovieDetails(found.tmdbId);

    const film = await FilmService.upsertFromTmdb({
        tmdbId: found.tmdbId,
        title: found.title,
        original_title: found.original_title,
        year: found.year,
        posterUrl: found.posterUrl,
        overview: found.overview,
        tmdbRate: found.tmdbRate,
        genres: details.genres,
        duration: details.runtime,
    });
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
        [Markup.button.callback('👾 Знайти схожі фільми', `RECOMMEND_${film._id}`)],
        [Markup.button.callback('🔗 Поділитись', `SHARE_${film._id}`)],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);

    const user = await UserService.getByTelegramId(ctx.from.id);
    const rating = await LibraryService.getRating(user._id, film._id);
    const userRating = rating ? `Твоя оцінка: ⭐ ${rating}/10\n\n` : ``;
    const tmdbRating = film.tmdbRate ? ` Оцінка TMDB: 💙 ${film.tmdbRate}/10\n\n` : ``;

    const caption = `<b>${film.title}</b>${film.originalTitle ? ` / <i>${film.originalTitle}</i> ` : ''} (${film.year || '?'})\n\n` +
        userRating + tmdbRating +
        `${film.description ? `${film.description}\n\n` : ''}Як зберегти цей фільм?`;

    await updateSearchFilmCardMessage(ctx, film, caption, keyboard);
}
