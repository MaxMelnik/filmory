import { User, Subscription } from '../models/index.js';

/**
 * UserService — відповідає за роботу з користувачами в базі даних.
 */
export class UserService {
    /**
     * Find user by telegramId
     */
    static async getByTelegramId(telegramId) {
        return User.findOne({ telegramId });
    }

    /**
     * Перевіряє, чи має користувач активний доступ до Filmory Plus.
     * @param {number} telegramId - Telegram ID користувача
     * @returns {Promise<boolean>} true, якщо Plus зараз активний
     */
    static async isPlus(telegramId) {
        if (!telegramId) {
            return false;
        }

        // шукаємо підписку Plus / Root для цього юзера
        const sub = await Subscription.findOne({
            telegramId,
            plan: { $in: ['PLUS', 'ROOT'] },
        }).lean();

        if (!sub) {
            return false;
        }

        // ROOT можна вважати «вічним» доступом
        if (sub.plan === 'ROOT') {
            return true;
        }

        // якщо немає дати закінчення — перестрахуємось і скажемо "нема доступу"
        if (!sub.expiresAt) {
            return false;
        }

        const now = Date.now();
        const expiresAtTime = new Date(sub.expiresAt).getTime();

        return expiresAtTime > now;
    }
}
