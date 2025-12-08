import { Markup } from 'telegraf';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';

export async function showSimilarRecommendations(ctx) {
    ctx.scene.state.recCat = 'show_similar';
    const text = escapeReservedCharacters(`🎬 Оберемо щось схоже на конкретний фільм.

Напиши назву фільму, а я підберу кілька варіантів із подібною атмосферою, сюжетом і стилем.
`);
    const keyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}
