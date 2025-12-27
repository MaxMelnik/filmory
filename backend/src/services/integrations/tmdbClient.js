import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../../utils/logger.js';

dotenv.config();

const { TMDB_API_KEY, TMDB_BASE_URL } = process.env;

if (!TMDB_API_KEY) {
    logger.error('❌ TMDB_API_KEY не знайдено у .env');
    process.exit(1);
}

/**
 * Search one film on TMDB by title
 * @param {string} title
 * @returns {Promise<Object|null>}
 */
export async function searchFilm(title) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                include_adult: false,
                language: 'uk-UA',
            },
        });

        const [first] = response.data.results;
        if (!first) return null;

        return {
            tmdbId: first.id,
            title: first.title || first.original_title,
            original_title: first.original_title,
            year: first.release_date ? first.release_date.slice(0, 4) : null,
            tmdbRate: first.vote_average,
            overview: first.overview,
            posterUrl: first.poster_path ?
                `https://image.tmdb.org/t/p/w500${first.poster_path}` :
                null,
        };
    } catch (error) {
        logger.error('❌ Помилка TMDB search:', error.message);
        return null;
    }
}

/**
 * Search all films on TMDB by title
 * @param {string} title
 * @param {string[]} allowedTypes = ['movie', 'tv']
 * @returns {Promise<Object|null>}
 */
export async function searchAllByMediaType(title, allowedTypes = ['movie', 'tv']) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                include_adult: true,
                language: 'uk-UA',
                page: 1,
            },
        });

        const results = response.data.results.filter((item) =>
            item && allowedTypes.includes(item.media_type),
        );

        if (results?.length === 0) return null;

        return results.map(film => ({
            tmdbId: film.id,
            title: film.title || film.original_title || film.name || film.original_name,
            original_title: film.original_title || '',
            year: (film.release_date ? film.release_date.slice(0, 4) : null) || (film.first_air_date ? film.first_air_date.slice(0, 4) : null),
            overview: film.overview,
            mediaType: film.media_type,
            tmdbRate: film.vote_average,
            posterUrl: film.poster_path ?
                `https://image.tmdb.org/t/p/w500${film.poster_path}` :
                null,
        }));
    } catch (error) {
        logger.error('❌ Помилка TMDB search:', error.message);
        return null;
    }
}

/**
 * 🔹 Отримати деталі фільму за TMDB ID
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getMovieDetails(id) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'uk-UA',
                append_to_response: 'external_ids,credits',
            },
        });

        const movie = response.data;

        return {
            tmdbId: movie.id,
            imdbId: movie.external_ids?.imdb_id,
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || null,
            runtime: movie.runtime,
            genres: movie.genres?.map((g) => g.name) || [],
            description: movie.overview,
            posterUrl: movie.poster_path ?
                `https://image.tmdb.org/t/p/w500${movie.poster_path}` :
                null,
        };
    } catch (error) {
        logger.error('❌ Помилка TMDB details:', error.message);
        return null;
    }
}

/**
 * 🔹 Отримати деталі фільму за TMDB ID
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getTvDetails(id) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'uk-UA',
                append_to_response: 'external_ids,credits',
            },
        });

        const tv = response.data;

        return {
            tmdbId: tv.id,
            imdbId: tv.external_ids?.imdb_id,
            title: tv.title,
            year: tv.release_date?.slice(0, 4) || null,
            runtime: tv.runtime,
            genres: tv.genres?.map((g) => g.name) || [],
            description: tv.overview,
            posterUrl: tv.poster_path ?
                `https://image.tmdb.org/t/p/w500${tv.poster_path}` :
                null,
        };
    } catch (error) {
        logger.error('❌ Помилка TMDB details:', error.message);
        return null;
    }
}

/**
 * 🔹 Отримати рекомендації за TMDB ID
 * @param {number|string} id
 * @returns {Promise<Array>}
 */
export async function getRecommendations(id) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}/recommendations`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'uk-UA',
            },
        });

        return response.data.results.slice(0, 5).map((m) => ({
            tmdbId: m.id,
            title: m.title,
            year: m.release_date ? m.release_date.slice(0, 4) : null,
            posterUrl: m.poster_path ?
                `https://image.tmdb.org/t/p/w500${m.poster_path}` :
                null,
        }));
    } catch (error) {
        logger.error('❌ Помилка TMDB recommendations:', error.message);
        return [];
    }
}
