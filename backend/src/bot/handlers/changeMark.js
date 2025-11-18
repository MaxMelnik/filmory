import { Markup } from 'telegraf';

export async function changeMark(ctx) {
    const filmId = parseInt(ctx.match[1]);

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();

    const ratingKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('1', `RATE_1_${filmId}`),
            Markup.button.callback('2', `RATE_2_${filmId}`),
            Markup.button.callback('3', `RATE_3_${filmId}`),
            Markup.button.callback('4', `RATE_4_${filmId}`),
            Markup.button.callback('5', `RATE_5_${filmId}`),
        ],
        [
            Markup.button.callback('6', `RATE_6_${filmId}`),
            Markup.button.callback('7', `RATE_7_${filmId}`),
            Markup.button.callback('8', `RATE_8_${filmId}`),
            Markup.button.callback('9', `RATE_9_${filmId}`),
            Markup.button.callback('10⭐', `RATE_10_${filmId}`),
        ],
    ]);

    await ctx.editMessageReplyMarkup(ratingKeyboard.reply_markup);
}
