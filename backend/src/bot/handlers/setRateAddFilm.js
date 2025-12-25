import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';
import { LibraryService } from '../../services/LibraryService.js';
import { getWatchedMessage } from '../../utils/templates/libraryMessages.js';

export async function setRateAddFilm(ctx) {
    const rate = parseInt(ctx.match[1]);
    const filmId = parseInt(ctx.match[2]);
    const film = ctx.scene.state.film;
    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, filmId, 'watched', rate);

    const watchlist = await LibraryService.getAllUserFilms(user._id, 'watched');
    const text = getWatchedMessage(film.title, watchlist.length, rate);
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
