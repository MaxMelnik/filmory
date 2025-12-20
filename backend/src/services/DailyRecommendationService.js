import { DailyRecommendation, Film } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * DailyRecommendationService
 */
export default class DailyRecommendationService {
    static async upsert(data) {
        let dailyRecommendation = await DailyRecommendation.findOne({ filmId: data.filmId });
        if (!dailyRecommendation) {
            dailyRecommendation = new DailyRecommendation(data);
        } else {
            dailyRecommendation.days = [
                ...new Set([
                    ...dailyRecommendation.days,
                    ...data.days,
                ]),
            ];
        }

        return dailyRecommendation.save();
    }

    static async getAllRecommendedFilms() {
        const dailyRecommendations = await DailyRecommendation.find().populate('filmId');
        const films = dailyRecommendations.map(dailyRecommendation => dailyRecommendation.filmId.title);

        logger.info(`getAllRecommendedFilms: ${films}`);

        return films;
    }

}
