import {
    FILMORY_PLUS_PAYLOAD, FILMORY_PLUS_PRICE_STARS,
    SUBSCRIPTION_PERIOD_SECONDS,
} from '../../config/subscription.js';
import { SubscriptionService } from '../../services/SubscriptionService.js';
import { UserService } from '../../services/UserService.js';
import { Markup } from 'telegraf';
import logger from '../../utils/logger.js';

export function registerPaymentHandlers(bot) {
    /**
     * 1) Telegram шле pre_checkout_query перед підтвердженням оплати
     */
    bot.on('pre_checkout_query', async (ctx) => {
        const q = ctx.update.pre_checkout_query;

        // мінімальна перевірка: наш payload і валюта зірок
        const isOurInvoice =
            q.invoice_payload === FILMORY_PLUS_PAYLOAD && q.currency === 'XTR';

        if (!isOurInvoice) {
            // якщо раптом щось інше – блокуємо
            return ctx.answerPreCheckoutQuery(false, 'Ця оплата зараз недоступна.');
        }

        // все ок – даємо Telegram "добро" на списання зірок
        return ctx.answerPreCheckoutQuery(true);
    });

    /**
     * 2) successful_payment – приходить після успішного списання Stars
     *    Для підписок приходить при ПЕРШІЙ оплаті і при кожному авто-продовженні.
     */
    bot.on('successful_payment', async (ctx) => {
        const sp = ctx.message.successful_payment;

        // підстраховка: беремо тільки наш план у Stars
        if (sp.currency !== 'XTR') return;
        if (sp.invoice_payload !== FILMORY_PLUS_PAYLOAD) return;

        const userId = ctx.from.id;
        const nowSec = Math.floor(Date.now() / 1000);

        // для star-subscription в Bot API є subscription_expiration_date
        // якщо з якоїсь причини його нема – рахуємо самі +30 днів
        const expiresAtSec =
            sp.subscription_expiration_date ??
            (nowSec + SUBSCRIPTION_PERIOD_SECONDS);

        const starsPaid = sp.total_amount; // 111 for Filmory Plus
        const isRecurring = sp.is_recurring ?? true;
        const isFirstRecurring = sp.is_first_recurring ?? false;

        await SubscriptionService.saveOrExtendPlus({
            telegramId: userId,
            expiresAtSec,
            starsPaid,
            isRecurring,
            isFirstRecurring,
            telegramPaymentChargeId: sp.telegram_payment_charge_id,
            providerPaymentChargeId: sp.provider_payment_charge_id,
        });

        await ctx.reply(
            'Дякую за підписку на Filmory Plus! ✨\n' +
            'Підписка активна, Filmory автоматично відкриє додаткові можливості.\n\n' +
            'Автоподовження відбуватиметься раз на 30 днів, доки в тебе є зірки або ти не скасуєш підписку.',
            Markup.inlineKeyboard([
                [Markup.button.callback('⬅ Назад', 'GO_BACK')],
            ]),
        );

        const user = await UserService.getByTelegramId(ctx.from.id);
        if (!user) return;
        logger.info(`Payment registered: @${user.username || user.telegramId}, ${starsPaid} ⭐`);
    });
}
