import { LibraryItem, User } from '../models/index.js';
import randomNumber from '../utils/randomNumber.js';
import logger from '../utils/logger.js';

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
     * @param {'recent'|'oldest'|'rating_high'|'rating_low'|'title_az'|'title_za'|'year_new'|'year_old'} order  — порядок сортування
     */
    static async getUserFilmsPaginated(
        telegramId,
        view = 'watchLater',
        page = 1,
        limit = 5,
        order = 'recent',
    ) {
        const user = await User.findOne({ telegramId }).lean();
        if (!user) {
            return { films: [], totalCount: 0, totalPages: 1, page: 1, order };
        }

        const match =
            view === 'watched'
                ? { userId: user._id, status: 'watched' }
                : { userId: user._id, status: 'watch_later' };

        const totalCount = await LibraryItem.countDocuments(match);
        const totalPages = Math.max(1, Math.ceil(totalCount / limit));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const skip = (safePage - 1) * limit;

        // 1) Визначаємо, чи order вимагає Film-полів (title/year)
        const needsFilmJoin = ['title_az', 'title_za', 'year_new', 'year_old'].includes(order);

        // 2) Мапа сортування для обох стратегій
        const sortMapFind = {
            recent: { updatedAt: -1 },
            oldest: { updatedAt: 1 },
            rating_high: { rating: -1, updatedAt: -1 },
            rating_low: { rating: 1, updatedAt: -1 },
        };

        const sortMapAgg = {
            recent: { updatedAt: -1 },
            oldest: { updatedAt: 1 },
            rating_high: { rating: -1, updatedAt: -1 },
            rating_low: { rating: 1, updatedAt: -1 },

            title_az: { 'film.title': 1, updatedAt: -1 },
            title_za: { 'film.title': -1, updatedAt: -1 },
            year_new: { 'film.year': -1, updatedAt: -1 },
            year_old: { 'film.year': 1, updatedAt: -1 },
        };

        if (!needsFilmJoin) {
            // ===== Шлях А: швидкий find + populate =====
            const sort = sortMapFind[order] ?? sortMapFind.recent;

            const items = await LibraryItem.find(match)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('filmId');

            const films = items
                .filter((item) => item.filmId)
                .map((item) => ({
                    _id: item.filmId._id,
                    title: item.filmId.title,
                    year: item.filmId.year,
                    status: item.status,
                    rating: item.rating,
                }));

            return { films, totalCount, totalPages, page: safePage, order };
        }

        // ===== Шлях Б: aggregate + lookup для title/year =====
        const sort = sortMapAgg[order] ?? sortMapAgg.recent;

        const rows = await LibraryItem.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'films', // ⚠️ перевір назву колекції Film у Mongo
                    localField: 'filmId',
                    foreignField: '_id',
                    as: 'film',
                },
            },
            { $unwind: '$film' },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    filmId: '$film._id',
                    title: '$film.title',
                    year: '$film.year',
                    status: 1,
                    rating: 1,
                },
            },
        ]);

        const films = rows.map((r) => ({
            _id: r.filmId,
            title: r.title,
            year: r.year,
            status: r.status,
            rating: r.rating,
        }));

        return { films, totalCount, totalPages, page: safePage, order };
    }

    /**
     * Отримати всі фільми користувача (без пагінації)
     */
    static async getAllUserFilms(userId, view = 'watch_later') {
        const filter =
            view === 'watched' ?
                { userId: userId, status: 'watched' } :
                { userId: userId, status: 'watch_later' };

        const items = await LibraryItem.find(filter).populate('filmId');
        return items.map((item) => item.filmId).filter(Boolean);
    }

    /**
     * Отримати випадковий фільм користувача
     */
    static async getRandomUserFilms(userId, view = 'watch_later') {
        const filter =
            view === 'watched' ?
                { userId: userId, status: 'watched' } :
                { userId: userId, status: 'watch_later' };

        await User.updateOne(
            { _id: userId },
            { $inc: { randomRollsTotal: 1 } },
            { upsert: true },
        ).catch((error) => logger.warn('Failed to update random roll statistics', error));
        const items = await LibraryItem.find(filter).populate('filmId');
        return items[randomNumber(0, items.length - 1)].filmId;
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
    static async getUserWorstFilms(userId, maxRating = 1, limit = 100) {
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
