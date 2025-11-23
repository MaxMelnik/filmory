import {
    FILMORY_PLUS_PRICE_STARS,
    SUBSCRIPTION_PERIOD_SECONDS,
    FILMORY_PLUS_PAYLOAD,
} from '../../config/subscription.js';

export async function createSubscriptionLink(ctx, paymentPlan = 'plus') {
    if (paymentPlan === 'plus') {
        return ctx.telegram.createInvoiceLink({
            title: 'Filmory Plus — 1 місяць',
            description:
                'Розширені рекомендації, розумні підбірки за настроєм, зручні фільтри і підтримка розробника Filmory.',
            payload: FILMORY_PLUS_PAYLOAD,
            provider_token: '',                 // для Stars завжди порожній
            currency: 'XTR',                    // Telegram Stars
            prices: [
                {
                    label: 'Filmory Plus (1 місяць)',
                    amount: FILMORY_PLUS_PRICE_STARS, // 111 зірок
                },
            ],
            subscription_period: SUBSCRIPTION_PERIOD_SECONDS, // 2592000 = 30 днів
        });
    }
}
