import { Film, LibraryItem } from '../models/index.js';

/**
 * FilmService — відповідає за роботу з фільмами у базі даних.
 * Використовує TMDB-дані або створює ручні записи.
 */
export class FilmService {
    /**
     * Знайти фільм за TMDB ID
     */
    static async getByTmdbId(tmdbId) {
        return Film.findOne({ tmdbId });
    }

    static truncateString(text, maxLength = 300) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength - 1).trimEnd() + '…';
    }

    /**
     * Додати або оновити фільм, отриманий з TMDB
     */
    static async upsertFromTmdb(found) {
        const data = {
            tmdbId: found.tmdbId,
            title: found.title,
            year: found.year,
            posterUrl: found.posterUrl,
            description: this.truncateString(found.overview),
            genres: found.genre_names || [],
        };

        let film = await Film.findOne({ tmdbId: data.tmdbId });
        if (!film) {
            film = new Film(data);
        } else {
            Object.assign(film, data);
        }

        return film.save();
    }

    /**
     * Створити фільм вручну (якщо користувач не знайшов потрібний у TMDB)
     */
    static async createManual(title) {
        let film = await Film.findOne({ title });
        if (!film) {
            film = new Film({
                title,
                year: null,
                genres: [],
                tmdbId: null,
                description: null,
                posterUrl: null,
            });
            return film.save();
        }

        return film.save();
    }

    /**
     * Додати фільм у список користувача
     */
    static async addToLibrary(userId, filmId, status = 'watch_later', rating = null, source) {
        const rawData = {
            userId,
            filmId,
            status,
            rating,
            source,
        };

        // Для апдейту чистимо null/undefined, щоб не перетирати існуючі значення
        const updateData = Object.fromEntries(
            Object.entries(rawData).filter(([, value]) => value !== null && value !== undefined),
        );

        let libraryItem = await LibraryItem.findOne({ userId, filmId });

        if (!libraryItem) {
            // для нового запису можна зберігати й null'и – це очікувана початкова стейт
            libraryItem = new LibraryItem(rawData);
        } else {
            // оновлюємо тільки ті поля, які реально прийшли з даними
            Object.assign(libraryItem, updateData);
        }

        return libraryItem.save();
    }

}
