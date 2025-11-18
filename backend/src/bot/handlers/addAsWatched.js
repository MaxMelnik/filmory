import { Markup } from 'telegraf';

export async function addAsWatched(ctx) {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();

    const ratingKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('1', `RATE_1_${film._id}`),
            Markup.button.callback('2', `RATE_2_${film._id}`),
            Markup.button.callback('3', `RATE_3_${film._id}`),
            Markup.button.callback('4', `RATE_4_${film._id}`),
            Markup.button.callback('5', `RATE_5_${film._id}`),
        ],
        [
            Markup.button.callback('6', `RATE_6_${film._id}`),
            Markup.button.callback('7', `RATE_7_${film._id}`),
            Markup.button.callback('8', `RATE_8_${film._id}`),
            Markup.button.callback('9', `RATE_9_${film._id}`),
            Markup.button.callback('10⭐', `RATE_10_${film._id}`),
        ],
    ]);

    await ctx.reply(
        `✅ Позначив <b>${film.title}</b> як переглянутий!\n\nОціни його від 1 до 10:`,
        { parse_mode: 'HTML', ...ratingKeyboard },
    );
}
