import { Subscription } from '../models/index.js';

export class SubscriptionService {
    /**
     * Створити або продовжити підписку Filmory Plus для користувача
     */
    static async saveOrExtendPlus({
        telegramId,
        expiresAtSec,
        starsPaid,
        isRecurring,
        isFirstRecurring,
        telegramPaymentChargeId,
        providerPaymentChargeId,
    }) {
        let sub = await Subscription.findOne({
            telegramId,
            plan: 'PLUS',
        });

        if (!sub) {
            sub = new Subscription({
                telegramId,
                plan: 'PLUS',
            });
        }

        sub.expiresAt = new Date(expiresAtSec * 1000);
        sub.lastPaymentAt = new Date();
        sub.lastPaymentStars = starsPaid;
        sub.isRecurring = isRecurring;
        sub.isFirstRecurring = isFirstRecurring;
        sub.telegramPaymentChargeId = telegramPaymentChargeId;
        sub.providerPaymentChargeId = providerPaymentChargeId;
        sub.isCanceled = false;

        await sub.save();
    }
}
