import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import logger from '../../utils/logger.js';

export function activityMiddleware() {
    return async (ctx, next) => {
        const telegramId = ctx.from?.id;
        if (telegramId) {
            AnalyticsService.trackUserActivity(telegramId).catch(logger.error);
        }
        return next();
    };
}
