import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { Markup } from 'telegraf';

export async function showRecommendationsMenu(ctx) {
    logger.info(`[RECOMMENDATIONS SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);

    const text = `
🎬 Як ти хочеш, щоб *Filmory* порадив фільм?

👤 Доступно всім користувачам:
    • На основі твоїх вподобань
    • Фільми, схожі на конкретний фільм

⭐ *Filmory Plus* — додаткові режими:
    • Рекомендації за настроєм
    • З ким плануєш дивитись?
    • Спільний перегляд із ще одним користувачем

Обери режим нижче 👇
`;

    const freeCatsButtons =
        [
            [{ text: '🎯 На основі вподобань', callback_data: 'PERSONAL_REC_CAT' }],
            [{ text: '🎬 Схожі на фільм', callback_data: 'SIMILAR_REC_CAT' }],
        ];

    const isPlus = await UserService.isPlus(ctx.from.id);
    const isPlusSymbol = isPlus ? '⭐' : '🔒';

    const plusCatsButtons =
        [
            [{ text: `🌈 За настроєм ${isPlusSymbol}`, callback_data: isPlus ? 'MOOD_REC_CAT' : 'PLUS_REC_CAT' }],
            [{ text: `👥 Для компанії ${isPlusSymbol}`, callback_data: isPlus ? 'COMPANY_REC_CAT' : 'PLUS_REC_CAT' }],
            [{ text: `🤝 Спільний перегляд ${isPlusSymbol}`, callback_data: isPlus ? 'COOP_REC_CAT' : 'PLUS_REC_CAT' }],
        ];

    const keyboard = [
        ...freeCatsButtons,
        ...plusCatsButtons,
        [{ text: `🏠︎ На головну`, callback_data: 'GO_HOME_AND_DELETE_MESSAGE' }],
    ];

    if (!ctx.session.editMessageText) {
        return await ctx.replyWithMarkdownV2(text, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    }

    ctx.session.editMessageText = false;

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}
