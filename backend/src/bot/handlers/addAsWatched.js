import { rateKeyboard } from '../../utils/keyboards/rateKeyboard.js';

export async function addAsWatched(ctx) {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();

    const ratingKeyboard = rateKeyboard(film._id);

    await ctx.reply(
        `✅ Позначив <b>${film.title}</b> як переглянутий!\n\nОціни його від 1 до 10:`,
        { parse_mode: 'HTML', ...ratingKeyboard },
    );
}
