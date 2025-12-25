import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';
import { getWatchlistMessage } from '../../utils/templates/libraryMessages.js';
import { LibraryService } from '../../services/LibraryService.js';

export async function addAsWatchLater(ctx) {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, film._id, 'watch_later');

    const watchlist = await LibraryService.getAllUserFilms(user._id, 'watch_later');
    const text = getWatchlistMessage(film.title, watchlist.length);
    const keyboard = [
        [{ text: '🎞 Перейти до збережених', callback_data: 'SHOW_LIST' }],
        [{ text: '⬅ Назад', callback_data: 'GO_SEARCH_FILM_AND_DELETE_MESSAGE' }],
    ];
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.replyWithMarkdownV2(text, {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
}
