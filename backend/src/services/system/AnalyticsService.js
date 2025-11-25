import { User } from '../../models/User.js';
import { AiRequestLog } from '../../models/index.js';

export class AnalyticsService {
    // call on EACH update from User
    static async trackUserActivity(telegramId) {
        if (!telegramId) return;

        const now = new Date();

        let user = await User.findOne({ telegramId });

        if (!user) return;

        user.lastActiveAt = now;
        if (!user.firstSeenAt) {
            user.firstSeenAt = now;
        }

        await user.save();
    }

    // call on EACH AI request
    static async trackAiRequest(telegramId, plan) {
        const log = new AiRequestLog({ telegramId, plan });
        await log.save();

        await User.updateOne(
            { telegramId },
            { $inc: { aiRequestsTotal: 1 } },
            { upsert: true },
        );
    }

    // MAU – number of active users per last 30 days
    static async getMau(days = 30) {
        const from = new Date();
        from.setDate(from.getDate() - days);

        return User.countDocuments({
            lastActiveAt: { $gte: from },
        });
    }

    // number of AI-requests per last 30-days
    static async getAiRequestsCount({ days = 30, plan } = {}) {
        const from = new Date();
        from.setDate(from.getDate() - days);

        const filter = { createdAt: { $gte: from } };
        if (plan) filter.plan = plan; // 'FREE' / 'PLUS'

        return AiRequestLog.countDocuments(filter);
    }

    // stats for previous N days
    static async getDailyRequests({ days = 7 } = {}) {
        const from = new Date();
        from.setDate(from.getDate() - days);

        return AiRequestLog.aggregate([
            { $match: { createdAt: { $gte: from } } },
            {
                $group: {
                    _id: {
                        y: { $year: '$createdAt' },
                        m: { $month: '$createdAt' },
                        d: { $dayOfMonth: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: {
                        $dateFromParts: {
                            year: '$_id.y',
                            month: '$_id.m',
                            day: '$_id.d',
                        },
                    },
                    count: 1,
                },
            },
            { $sort: { date: 1 } },
        ]);
    }
}
