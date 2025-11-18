import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';

export async function addAsWatchLater(ctx) {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, film._id, 'watch_later');

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(`🎬 Додав <b>${film.title}</b> до списку “подивитись пізніше”!`, {
        parse_mode: 'HTML',
    });
    await ctx.scene.leave();
}
