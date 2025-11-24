import { AnalyticsService } from '../../services/system/AnalyticsService.js';

export function activityMiddleware() {
    return async (ctx, next) => {
        const telegramId = ctx.from?.id;
        if (telegramId) {
            AnalyticsService.trackUserActivity(telegramId).catch(console.error);
        }
        return next();
    };
}
