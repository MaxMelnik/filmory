import { Scenes } from 'telegraf';
import { handleFilmTitleInput } from '../handlers/addFilm.js';
import logger from '../../utils/logger.js';
import { openSearchFilmCard } from '../handlers/openSearchFilmCard.js';
import { addAsWatchLater } from '../handlers/addAsWatchLater.js';
import { addAsWatched } from '../handlers/addAsWatched.js';
import { setRateAddFilm } from '../handlers/setRateAddFilm.js';
import { saveManual } from '../handlers/saveManual.js';
import { showRecommendationsMenu } from '../handlers/showRecommendationsMenu.js';
import { message } from 'telegraf/filters';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import {
    getCoopFilmRecommendations,
    getFilmRecommendations,
    getFilmRecommendationsByMood,
    getListOfFilmsRecommendations,
} from '../../services/integrations/geminiService.js';
import parseRecommendations from '../../utils/parseRecommendations.js';
import {
    plusOnlyRestriction,
    showPersonalRecommendations,
    showSimilarRecommendations,
    showMoodRecommendations,
    showCompanyRecommendations,
    showCooperativeRecommendations,
} from '../handlers/recommendationsCategories.js';
import { UserService } from '../../services/UserService.js';
import bot from '../index.js';
import { LibraryService } from '../../services/LibraryService.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';

const scene = new Scenes.BaseScene('RECOMMENDATION_SCENE_ID');

// Enter Recommendations Scene
scene.enter(async (ctx) => await showRecommendationsMenu(ctx));

scene.action('PLUS_REC_CAT', async (ctx) => await plusOnlyRestriction(ctx));

scene.action('PERSONAL_REC_CAT', async (ctx) => await showPersonalRecommendations(ctx));

scene.action('SIMILAR_REC_CAT', async (ctx) => await showSimilarRecommendations(ctx));

scene.action('MOOD_REC_CAT', async (ctx) => await showMoodRecommendations(ctx));

scene.action('COMPANY_REC_CAT', async (ctx) => await showCompanyRecommendations(ctx));

scene.action('COOP_REC_CAT', async (ctx) => await showCooperativeRecommendations(ctx));

scene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();
    if (handleCommandsOnText(ctx, input)) return;

    if (ctx.scene.state.recCat === 'show_similar') {
        logger.info(`show_similar: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми схожі на "${input}"`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendations(input),
            onDone: (ctx, response) => parseRecommendations(ctx, `🎬 Фільми схожі на "${input}":`, response),
        });
    }
    if (ctx.scene.state.recCat === 'show_mood') {
        logger.info(`show_mood: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми за настроєм "${input}"`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendationsByMood(input),
            onDone: (ctx, response) => parseRecommendations(ctx, `🎬 Фільми за настроєм "${input}":`, response),
        });
    }
    if (ctx.scene.state.recCat === 'show_company') {
        logger.info(`show_company: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми для перегляду ${input}`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendationsByMood(input),
            onDone: (ctx, response) => parseRecommendations(ctx, `🎬 Фільми для перегляду ${input}:`, response),
        });
    }
    if (ctx.scene.state.recCat === 'show_coop') {
        logger.info(`show_coop: ${input}`);

        let telegramId = ctx.message.forward_from ? ctx.message.forward_from.id : null;
        telegramId ??= (await UserService.getByUsername(input))?.telegramId;

        const info = await bot.telegram.getMe();
        if (!telegramId) {
            return ctx.replyWithMarkdownV2(`Схоже, цей користувач ще не користувався *Filmory*\\.
        
Попроси його зайти в @${escapeReservedCharacters(info.username)} і додати свої улюблені фільми\\.
`);
        }

        const userOne = await UserService.getByTelegramId(ctx.from.id);
        const userTwo = await UserService.getByTelegramId(telegramId);

        const userOneFavouriteMovies = await LibraryService.getUserFavouriteFilms(userOne._id, 8);
        const userOneWorstMovies = await LibraryService.getUserWorstFilms(userOne._id, 4);

        const userTwoFavouriteMovies = await LibraryService.getUserFavouriteFilms(userTwo._id, 8);
        const userTwoWorstMovies = await LibraryService.getUserWorstFilms(userTwo._id, 4);

        const userOneIncludeFilms = userOneFavouriteMovies
            .map(movie => movie.title)
            .filter(Boolean)
            .map(title => `"${title}"`)
            .join(', ');

        const userOneExcludeFilms = userOneWorstMovies
            .map(movie => movie.title)
            .filter(Boolean)
            .map(title => `"${title}"`)
            .join(', ');

        const userTwoIncludeFilms = userTwoFavouriteMovies
            .map(movie => movie.title)
            .filter(Boolean)
            .map(title => `"${title}"`)
            .join(', ');

        const userTwoExcludeFilms = userTwoWorstMovies
            .map(movie => movie.title)
            .filter(Boolean)
            .map(title => `"${title}"`)
            .join(', ');

        logger.info(userOneIncludeFilms);
        logger.info(userOneExcludeFilms);
        logger.info(userTwoIncludeFilms);
        logger.info(userTwoExcludeFilms);

        return await showWaiter(ctx, {
            message: `Шукаю фільми для перегляду разом з @${userTwo.username}`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getCoopFilmRecommendations(userOneIncludeFilms, userOneExcludeFilms, userTwoIncludeFilms, userTwoExcludeFilms),
            onDone: (ctx, response) => parseRecommendations(ctx, '🎬 Я знайшов для вас фільми, які сподобаються обом:', response),
        });
    }
});

// Film Card keyboard handlers
scene.action(/^SAVE_ACTIVE_REC_(\d+)$/, async (ctx) => {
    logger.info(`SAVE_ACTIVE_REC_${parseInt(ctx.match[1])}`);
    const activeRecommendationIndex = parseInt(ctx.match[1]);
    const recommendation = ctx.session.recommendations[activeRecommendationIndex];
    logger.info(recommendation);

    ctx.answerCbQuery();

    if (!recommendation) return;

    ctx.session.title = recommendation.original_title;
    ctx.session.awaitingFilmTitle = true;
    await handleFilmTitleInput(ctx);
});

scene.action('NEXT_FILM_SEARCH', async (ctx) => {
    ctx.scene.state.filmIndex++;
    if (ctx.scene.state.filmIndex >= ctx.scene.state.films.length) ctx.scene.state.filmIndex = 0;
    await ctx.answerCbQuery();
    await openSearchFilmCard(ctx);
});

scene.action('PREV_FILM_SEARCH', async (ctx) => {
    ctx.scene.state.filmIndex--;
    if (ctx.scene.state.filmIndex < 0) ctx.scene.state.filmIndex = ctx.scene.state.films.length - 1;
    await ctx.answerCbQuery();
    await openSearchFilmCard(ctx);
});

// === Додати у "Подивитись пізніше" ===
scene.action('ADD_WATCH_LATER', async (ctx) => addAsWatchLater(ctx));

// === Вже переглянуто → показати оцінку ===
scene.action('ADD_WATCHED', async (ctx) => addAsWatched(ctx));

// === Обробка вибору рейтингу ===
scene.action(/^RATE_(\d+)_(\d+)$/, async (ctx) => setRateAddFilm(ctx));

scene.action('SAVE_MANUAL', async (ctx) => saveManual(ctx));

// === Вихід зі сцени ===
scene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default scene;
