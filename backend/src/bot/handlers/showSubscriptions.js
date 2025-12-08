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

        return ctx.replyWithMarkdown(
            `*Filmory Plus ✨*

Дає тобі більше з того, заради чого ти користуєшся *Filmory*:
• Без ліміту на розумні рекомендації;
• Ранній доступ до нових функцій і експериментів;
• Ти напряму підтримуєш розвиток бота 💛

*Ціна:* ${FILMORY_PLUS_PRICE_STARS} ⭐ на місяць (~90 грн).
Підписка автоматично подовжується раз на 30 днів, доки в тебе є зірки *або ти її не скасуєш*.
Скасувати можна будь-коли одним натисканням.`,
            Markup.inlineKeyboard([
                [Markup.button.url(`🔓 Оформити за ${FILMORY_PLUS_PRICE_STARS} ⭐`, link)],
                [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_DELETE_MESSAGE')]]),
        );
    }

    const untilLabel = await SubscriptionService.getSubscriptionExpiryLabel(telegramId);

    return ctx.replyWithMarkdown(
        `⭐ У тебе вже активний *Filmory Plus*!

✅ Більше щоденних запитів до ШІ
✅ Ранній доступ до нових функцій і експериментів
✅ Підтримка розробки Filmory 💚

Твоя підписка діє до: *${untilLabel}*
_(потім вона буде подовжена автоматично, якщо автоплатіж увімкнений)_`,
        Markup.inlineKeyboard([
            [Markup.button.callback('⚙ Керувати підпискою', 'MANAGE_SUBSCRIPTION')],
            [Markup.button.callback('🎞 Мій список', 'SHOW_LIST')],
            [Markup.button.callback('👾 Рекомендації', 'GET_RECS')],
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_DELETE_MESSAGE')],
        ]));
}
