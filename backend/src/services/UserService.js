import { User, Subscription } from '../models/index.js';
import logger from '../utils/logger.js';

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
     * Find user by username
     */
    static async getByUsername(username) {
        if (username.startsWith('@')) username = username.slice(1);
        return User.findOne({ username });
    }

    static async getOrCreateUserFromCtx(ctx) {
        const telegramId = ctx.from.id;

        let user = await User.findOne({ telegramId });

        if (!user) {
            user = await User.create({
                telegramId,
                username: ctx.from.username,
                firstName: ctx.from.first_name,
                lastName: ctx.from.last_name,
            });
            logger.info(`[NEW USER] @${user.username || user.telegramId}`);
        }

        return user;
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
            plan: { $in: ['PLUS', 'ROOT', 'PROMO'] },
        }).lean();

        if (!sub) {
            return false;
        }

        // ROOT можна вважати «вічним» доступом
        if (sub.plan === 'ROOT' || sub.plan === 'PROMO') {
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

    static async isPromo(telegramId) {
        if (!telegramId) {
            return false;
        }

        const sub = await Subscription.findOne({
            telegramId,
            plan: 'PROMO',
        }).lean();

        return !!sub;
    }

    static async isRoot(telegramId) {
        if (!telegramId) {
            return false;
        }

        const sub = await Subscription.findOne({
            telegramId,
            plan: 'ROOT',
        }).lean();

        return !!sub;
    }
}
