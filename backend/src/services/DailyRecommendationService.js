import { DailyRecommendation } from '../models/index.js';
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

    static async getAllRecommendedFilmsAsPlainText() {
        const dailyRecommendations = await DailyRecommendation.find().populate('filmId');
        const films = dailyRecommendations.map(
            dailyRecommendation =>
                ` ${dailyRecommendation.filmId.title}"/"${dailyRecommendation.filmId.originalTitle} (${dailyRecommendation.filmId.year})`);
        // ` {"title": "${dailyRecommendation.filmId.title}", "original_title": "${dailyRecommendation.filmId.originalTitle}", "year": "${dailyRecommendation.filmId.year}"}`);

        logger.info(`getAllRecommendedFilms: ${films}`);

        return films;
    }

    static async getAllRecommendedFilms() {
        const dailyRecommendations = await DailyRecommendation.find().populate('filmId');

        return dailyRecommendations.map(({ filmId }) => ({
            tmdb_id: filmId.tmdbId ?? null,
            imdb_id: filmId.imdbId ?? null,
            title: filmId.title ?? null,
            original_title: filmId.originalTitle ?? null,
            year: filmId.year ?? null,
        }));
    }

}
