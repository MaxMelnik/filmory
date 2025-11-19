import { LibraryItem, User } from '../models/index.js';

/**
 * LibraryService — управління бібліотекою користувача:
 * додавання, зміна статусів, отримання фільмів, пагінація.
 */
export class LibraryService {
    /**
     * Отримати фільми користувача з пагінацією
     * @param {number} telegramId — Telegram ID користувача
     * @param {'watchLater'|'watched'} view — тип списку
     * @param {number} page — номер сторінки
     * @param {number} limit — кількість фільмів на сторінку
     */
    static async getUserFilmsPaginated(telegramId, view = 'watchLater', page = 1, limit = 5) {
        const user = await User.findOne({ telegramId });
        const filter =
            view === 'watched' ?
                { userId: user._id, status: 'watched' } :
                { userId: user._id, status: 'watch_later' };

        const totalCount = await LibraryItem.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));
        const skip = (page - 1) * limit;

        const items = await LibraryItem.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('filmId'); // підтягує назву, рік тощо з Film

        const films = items
            .filter((item) => item.filmId)
            .map((item) => ({
                _id: item.filmId._id,
                title: item.filmId.title,
                year: item.filmId.year,
                status: item.status,
            }));

        return { films, totalCount, totalPages };
    }

    /**
     * Отримати всі фільми користувача (без пагінації)
     */
    static async getAllUserFilms(userId, view = 'watchLater') {
        const filter =
            view === 'watched' ?
                { user: userId, status: 'watched' } :
                { user: userId, status: 'watch_later' };

        const items = await LibraryItem.find(filter).populate('filmId');
        return items.map((item) => item.filmId).filter(Boolean);
    }

    /**
     * Get user favourite films iteratively
     */
    static async getUserFavouriteFilms(userId, minRating = 10, limit = 100) {
        for (let rating = minRating; rating > 4; rating--) {
            const items = await LibraryItem.find({
                userId: userId,
                status: 'watched',
                rating: { $gte: rating },
            }).limit(limit).lean();

            if (items.length > 0) {
                await LibraryItem.populate(items, { path: 'filmId' });
                return items.map((i) => i.filmId).filter(Boolean);
            }
        }
        return [];
    }

    /**
     * Get user worst films
     */
    static async getUserWorstFilms(userId, maxRating = 1, limit = 25) {
        const items = await LibraryItem.find({
            userId: userId,
            status: 'watched',
            rating: { $lte: maxRating },
        }).limit(limit).lean();

        if (items.length > 0) {
            await LibraryItem.populate(items, { path: 'filmId' });
            return items.map((i) => i.filmId).filter(Boolean);
        }
        return [];
    }

    /**
     * Get users rating for film
     */
    static async getRating(userId, filmId) {
        const item = await LibraryItem.findOne({
            userId,
            filmId,
        }).lean();

        return item?.rating;
    }

    /**
     * Check if film is starred by user
     */
    static async isStarred(userId, filmId, status = 'watched') {
        const item = await LibraryItem.findOne({
            userId,
            filmId,
            status,
        }).lean();

        return item?.rating === 10;
    }

    /**
     * Check if film is disliked by user
     */
    static async isDisliked(userId, filmId, status = 'watched') {
        const item = await LibraryItem.findOne({
            userId,
            filmId,
            status,
        }).lean();

        return item?.rating <= 4;
    }

    static async deleteFilmFromUserLibrary(userId, filmId) {
        const filter = {
            userId,
            filmId,
        };

        await LibraryItem.deleteOne(filter);
    }
}
