import { rateKeyboard } from '../../utils/keyboards/rateKeyboard.js';

export async function changeMark(ctx) {
    const filmId = parseInt(ctx.match[1]);

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();

    const ratingKeyboard = rateKeyboard(filmId);

    await ctx.editMessageReplyMarkup(ratingKeyboard.reply_markup);
}
