import { Subscription } from '../models/index.js';
import { UserService } from './UserService.js';

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

    /**
     * Повертає активну підписку користувача (PLUS/ROOT/PROMO), якщо вона ще діє.
     * @param {number} telegramId
     * @returns {Promise<Subscription|{isPromo: boolean}|null>}
     */
    static async getActiveSubscription(telegramId) {
        const now = new Date();

        const sub = await Subscription.findOne({
            telegramId,
            plan: { $in: ['PLUS', 'ROOT', 'PROMO'] },
            isCanceled: { $ne: true },
            expiresAt: { $gt: now },
        })
            .sort({ expiresAt: -1 })
            .exec();

        return sub || null;
    }

    /**
     * Повертає дату, до якої діє підписка (або null, якщо немає активної).
     * @param {number} telegramId
     * @returns {Promise<Date|null>}
     */
    static async getSubscriptionExpiryDate(telegramId) {
        const sub = await this.getActiveSubscription(telegramId);
        return sub ? sub.expiresAt : null;
    }

    /**
     * Повертає гарний рядок для UI, типу "до 12.01.2026".
     * @param {number} telegramId
     * @param {string} locale - наприклад 'uk-UA'
     * @returns {Promise<string|null>}
     */
    static async getSubscriptionExpiryLabel(telegramId, locale = 'uk-UA') {
        const isRoot = await UserService.isRoot(telegramId);
        const isPromo = await UserService.isPromo(telegramId);
        if (isRoot || isPromo) return `∞`;

        const expiresAt = await this.getSubscriptionExpiryDate(telegramId);
        if (!expiresAt) return null;

        return expiresAt.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }
}
