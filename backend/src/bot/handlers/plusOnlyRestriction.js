import { Markup } from 'telegraf';
import logger from '../../utils/logger.js';

export async function plusOnlyRestriction(ctx) {
    logger.info(`[PLUS ONLY RESTRICTION] @${ctx.from.username || ctx.from.id}`);
    const text = `😌 Схоже у тебе немає активної підписки *Plus*\\.

З *Plus* ти отримаєш додаткові режими рекомендацій
\\(за настроєм, для компанії, спільний перегляд\\)\\.

Можеш оформити *⭐ Filmory Plus* зараз або отримати рекомендації з загальнодоступних категорій 👇
`;
    const keyboard = [
        [{ text: `⭐ Filmory Plus`, callback_data: 'GET_SUBSCRIPTION' }],
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}
