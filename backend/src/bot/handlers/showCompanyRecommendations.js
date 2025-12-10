import { Markup } from 'telegraf';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import { UserService } from '../../services/UserService.js';
import { plusOnlyRestriction } from './plusOnlyRestriction.js';

export async function showCompanyRecommendations(ctx) {
    if (!await UserService.isPlus(ctx.from.id)) {
        return await plusOnlyRestriction(ctx);
    }
    ctx.scene.state.recCat = 'show_company';
    const text = escapeReservedCharacters(`👥 Добре, давай підберемо фільм під компанію.

Напиши, з ким ви дивитесь і який у вас вайб, наприклад:

• «з дівчиною, хочеться романтики без крінжа»
• «з друзями, щось веселе, щоб ржати й не сильно думати»
• «з колегами після роботи, якийсь нейтральний фільм»
• «я сам, хочу щось глибоке й трошки депресивне»

Чим точніше опишеш компанію й настрій вечора — тим краще я попаду в рекомендації 🎯
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
