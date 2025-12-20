import { postMovieToChannel } from '../services/integrations/telegramMessagesService.js';
import { createDailyRecommendation } from '../utils/templates/filmCards.js';
import getTodayKey from '../utils/getTodayKey.js';
import { getDailyRecommendation } from '../services/integrations/geminiService.js';
import { getMovieDetails, searchFilm } from '../services/integrations/tmdbClient.js';
import formatRuntime from '../utils/formatRuntime.js';
import { FilmService } from '../services/FilmService.js';
import DailyRecommendationService from '../services/DailyRecommendationService.js';

export default async () => {
    const excludeFilms = await DailyRecommendationService.getAllRecommendedFilms();
    const dailyRecommendation = (await getDailyRecommendation(excludeFilms.toString()))[0];
    const film = await searchFilm(dailyRecommendation.original_title ?? dailyRecommendation.title);
    const details = await getMovieDetails(film.tmdbId);

    const savedFilm = await FilmService.upsertFromTmdb({
        tmdbId: film.tmdbId,
        title: film.title,
        original_title: film.original_title,
        year: film.year,
        posterUrl: film.posterUrl,
        overview: film.overview,
        genres: details.genres,
        duration: details.runtime,
    });

    const { caption, keyboard } = await createDailyRecommendation({
        day: getTodayKey(),
        title: film.title ?? dailyRecommendation.title,
        originalTitle: film.original_title ?? dailyRecommendation.original_title,
        year: film.year ?? dailyRecommendation.year,
        genres: details.genres,
        duration: formatRuntime(details.runtime),
        description: dailyRecommendation.why_recommended.trim(),
        filmId: savedFilm._id,
    });
    await postMovieToChannel(film.posterUrl, caption, keyboard);

    if (process.env.ENVIRONMENT === 'PROD') {
        DailyRecommendationService.upsert({
            filmId: savedFilm._id,
            days: [getTodayKey()],
        });
    }
};
