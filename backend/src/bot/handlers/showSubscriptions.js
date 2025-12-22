import { Markup } from 'telegraf';
import { FILMORY_PLUS_PRICE_STARS } from '../../config/subscription.js';
import { createSubscriptionLink } from '../../services/integrations/telegramStarsService.js';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { SubscriptionService } from '../../services/SubscriptionService.js';

export async function showSubscriptions(ctx, paymentPlan = 'plus') {
    logger.info(`[SUBSCRIPTION SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    await UserService.getOrCreateUserFromCtx(ctx);
    const telegramId = ctx.from.id;
    const isPlus = await UserService.isPlus(telegramId);
    if (!isPlus) {
        const link = await createSubscriptionLink(ctx, paymentPlan);
        if (!link) {
            ctx.reply('🥺 Не знайшов такий План...');
            return ctx.scene.enter('START_SCENE_ID');
        }

        const text = `*Filmory Plus ✨*

Дає тобі більше з того, заради чого ти користуєшся *Filmory*:
• Без ліміту на розумні рекомендації;
• Розумні рекомендації за твоїм настроєм та компанією для перегляду;
• Спільні рекомендації для двох користувачів;
• Знаходь фільм, навіть якщо не знаєш назву;
• Ранній доступ до нових функцій і експериментів;
• Ти напряму підтримуєш розвиток бота 💛

*Ціна:* ${FILMORY_PLUS_PRICE_STARS} ⭐ на місяць (~90 грн).
Підписка автоматично подовжується раз на 30 днів, доки в тебе є зірки *або ти її не скасуєш*.
Скасувати можна будь-коли одним натисканням.`;

        const keyboard = [
            [{ text: `🔓 Оформити за ${FILMORY_PLUS_PRICE_STARS} ⭐`, url: link }],
            [{ text: `🏠︎ На головну`, callback_data: 'GO_HOME_AND_DELETE_MESSAGE' }],
        ];

        if (!ctx.session.editMessageText) {
            return await ctx.replyWithMarkdown(text, {
                reply_markup: {
                    inline_keyboard: keyboard,
                },
            });
        }

        ctx.session.editMessageText = false;

        await ctx
            .editMessageText?.(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) })
            .catch(async () => {
                await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
            });
    }

    const untilLabel = await SubscriptionService.getSubscriptionExpiryLabel(telegramId);

    const text = `⭐ У тебе вже активний *Filmory Plus*!

✅ Більше щоденних запитів до ШІ
✅ Розумні рекомендації за твоїм настроєм та компанією для перегляду;
✅ Ранній доступ до нових функцій і експериментів
✅ Підтримка розробки Filmory 💚

Твоя підписка діє до: *${untilLabel}*
_(потім вона буде подовжена автоматично, якщо автоплатіж увімкнений)_`;

    const keyboard = [
        [{ text: '⚙ Керувати підпискою', callback_data: 'MANAGE_SUBSCRIPTION' }],
        [{ text: '🎞 Мій список', callback_data: 'SHOW_LIST' }],
        [{ text: '👾 Рекомендації', callback_data: 'GET_RECS' }],
        [{ text: `🏠︎ На головну`, callback_data: 'GO_HOME_AND_DELETE_MESSAGE' }],
    ];

    if (!ctx.session.editMessageText) {
        return await ctx.replyWithMarkdown(text, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    }

    ctx.session.editMessageText = false;

    await ctx
        .editMessageText?.(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
        });
}
