import { Markup } from 'telegraf';
import { FILMORY_PLUS_PRICE_STARS } from '../../config/subscription.js';
import { createSubscriptionLink } from '../../services/integrations/telegramStarsService.js';

export async function showSubscriptions(ctx, paymentPlan = 'plus') {
    console.log(`[SUBSCRIPTION SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const link = await createSubscriptionLink(ctx, paymentPlan);
    if (!link) {
        ctx.reply('🥺 Не знайшов такий План...');
        return ctx.scene.enter('START_SCENE_ID');
    }

    return ctx.replyWithMarkdown(
        `*Filmory Plus ✨*

Дає тобі більше з того, заради чого ти користуєшся *Filmory*:
• без ліміту на розумні рекомендації за настроєм і компанією;
• ранній доступ до нових функцій і експериментів;
• ти напряму підтримуєш розвиток бота 💛

*Ціна:* ${FILMORY_PLUS_PRICE_STARS} ⭐ на місяць (~90 грн).
Підписка автоматично подовжується раз на 30 днів, доки в тебе є зірки *або ти її не скасуєш*.
Скасувати можна будь-коли одним натисканням.`,
        Markup.inlineKeyboard([
            [Markup.button.url(`🔓 Оформити за ${FILMORY_PLUS_PRICE_STARS} ⭐`, link)],
            [Markup.button.callback('⬅ Назад', 'GO_BACK')]]),
    );
}
