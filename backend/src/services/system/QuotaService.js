import { Usage } from '../../models/index.js';
import { FREE_DAILY_LIMIT, PLUS_DAILY_LIMIT, MIN_REQUEST_INTERVAL_MS } from '../../config/limits.js';
import { UserService } from '../UserService.js';
import { AnalyticsService } from './AnalyticsService.js';
import { Markup } from 'telegraf';
import logger from '../../utils/logger.js';

function getTodayKey() {
    // Можеш тут використати moment.tz / dayjs.tz, якщо вже є,
    // але для MVP можна й по UTC:
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Перевіряє, чи можна зробити ще один AI-запит,
 * і, якщо так, інкрементить лічильник.
 *
 * @param {number} telegramId
 * @param {'FREE'|'PLUS'|'ROOT'} plan
 * @returns {Promise<{allowed: boolean, reason?: string, remaining?: number}>}
 */
export async function checkAndConsumeQuota(telegramId, plan) {
    const dayKey = getTodayKey();
    const limit =
        plan === 'PLUS' || plan === 'ROOT'
            ? PLUS_DAILY_LIMIT
            : FREE_DAILY_LIMIT;

    let usage = await Usage.findOne({ telegramId });

    const now = new Date();

    if (!usage) {
        usage = new Usage({
            telegramId,
            dayKey,
            requestsToday: 0,
            lastRequestAt: new Date(0),
        });
    }

    // Якщо день змінився — скидаємо лічильник
    if (usage.dayKey !== dayKey) {
        usage.dayKey = dayKey;
        usage.requestsToday = 0;
    }

    // Rate-limit: занадто часті запити (захист від скриптів)
    const diffMs = now - (usage.lastRequestAt || new Date(0));
    if (diffMs < MIN_REQUEST_INTERVAL_MS) {
        logger.info(`[QUOTA REACHED]: ${telegramId} ${plan} 'too_fast'`);
        return {
            allowed: false,
            reason: 'too_fast',
            remaining: Math.max(limit - usage.requestsToday, 0),
        };
    }

    // Перевірка денного ліміту
    if (usage.requestsToday >= limit) {
        logger.info(`[QUOTA REACHED]: ${telegramId} ${plan} 'quota_exceeded'`);
        return {
            allowed: false,
            reason: 'quota_exceeded',
            remaining: 0,
        };
    }

    // Все ок — інкрементимо
    usage.requestsToday += 1;
    usage.lastRequestAt = now;
    await usage.save();

    return {
        allowed: true,
        remaining: limit - usage.requestsToday,
    };
}

export async function isRequestAllowed(ctx, goBackKeyboard = null, getPlusKeyboard = null) {
    const telegramId = ctx.from.id;
    const isPlus = await UserService.isPlus(telegramId);
    let plan = isPlus ? 'PLUS' : 'FREE';

    const quota = await checkAndConsumeQuota(telegramId, plan);

    if (!quota.allowed) {
        goBackKeyboard ??= Markup.inlineKeyboard([
            [Markup.button.callback('⬅ Назад', 'GO_BACK')],
        ]);
        getPlusKeyboard ??= Markup.inlineKeyboard([
            [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
            [Markup.button.callback('⬅ Назад', 'GO_BACK')],
        ]);

        if (quota.reason === 'too_fast') {
            await ctx.reply('Ти надто швидко надсилаєш запити 😅 Спробуй ще раз за кілька секунд.',
                goBackKeyboard);
            return false;
        }
        if (plan === 'FREE') {
            await ctx.reply(
                'Ти використав сьогодні всі 5 безкоштовних запитів.\n' +
                'Оформи Filmory Plus, щоб отримати більше рекомендацій ✨',
                getPlusKeyboard,
            );
            return false;
        }
        await ctx.reply(
            'Ти сьогодні дуже активно користувався Filmory Plus 😊\n' +
            'Ми тимчасово зупинили нові запити, щоб захистити сервіс від зловживань.\n' +
            'Спробуй ще раз завтра.',
            goBackKeyboard,
        );
        return false;
    }

    plan = await UserService.isRoot(telegramId) ? 'ROOT' : plan;
    AnalyticsService.trackAiRequest(telegramId, plan).catch(console.error);
    return true;
}
