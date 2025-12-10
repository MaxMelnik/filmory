import { Markup } from 'telegraf';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import { UserService } from '../../services/UserService.js';
import { plusOnlyRestriction } from './plusOnlyRestriction.js';

export async function showMoodRecommendations(ctx) {
    if (!await UserService.isPlus(ctx.from.id)) {
        return await plusOnlyRestriction(ctx);
    }
    ctx.scene.state.recCat = 'show_mood';
    const text = escapeReservedCharacters(`🌈 Підберемо фільм під твій настрій.

Напиши кількома словами, чого хочеться зараз.

• «щось легке й затишне, щоб розслабитись після роботи»
• «темний психологічний трилер, щоб мозок вибухнув»
• «страшний хоррор, але без занадто жорстких сцен»
• «ностальгія за 2000-ми, трошки романтики і музика»

Можеш комбінувати настрій, жанр, темп, навіть емоції — я все це врахую в добірці 🎬
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
