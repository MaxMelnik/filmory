import { Scenes } from 'telegraf';
import logger from '../../utils/logger.js';
import { showRecommendationsMenu } from '../handlers/showRecommendationsMenu.js';
import { message } from 'telegraf/filters';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import {
    getCoopFilmRecommendations,
    getFilmRecommendations, getFilmRecommendationsByCompany,
    getFilmRecommendationsByMood,
} from '../../services/integrations/geminiService.js';
import parseRecommendations from '../../utils/parseRecommendations.js';
import {
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
import filmCardControls from '../handlers/filmCardControls.js';

const scene = new Scenes.BaseScene('RECOMMENDATION_SCENE_ID');

// Enter Recommendations Scene
scene.enter(async (ctx) => await showRecommendationsMenu(ctx));

scene.action('PERSONAL_REC_CAT', async (ctx) => await showPersonalRecommendations(ctx));

scene.action('SIMILAR_REC_CAT', async (ctx) => await showSimilarRecommendations(ctx));

scene.action('MOOD_REC_CAT', async (ctx) => await showMoodRecommendations(ctx));

scene.action('COMPANY_REC_CAT', async (ctx) => await showCompanyRecommendations(ctx));

scene.action('COOP_REC_CAT', async (ctx) => await showCooperativeRecommendations(ctx));

scene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();
    if (await handleCommandsOnText(ctx, input)) return;

    if (ctx.scene.state.recCat === 'show_similar') {
        logger.info(`show_similar: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми схожі на "${input}"`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendations(input),
            onDone: async (ctx, response) => await parseRecommendations(ctx, `🎬 Фільми схожі на "${input}":`, response),
        });
    }
    if (ctx.scene.state.recCat === 'show_mood') {
        logger.info(`show_mood: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми за настроєм "${input}"`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendationsByMood(input),
            onDone: async (ctx, response) => await parseRecommendations(ctx, `🎬 Фільми за настроєм "${input}":`, response),
        });
    }
    if (ctx.scene.state.recCat === 'show_company') {
        logger.info(`show_company: ${input}`);
        return await showWaiter(ctx, {
            message: `Шукаю фільми для перегляду ${input}`,
            animation: 'emoji', // "dots", "emoji", "phrases"
            delay: 500,
            asyncTask: async () => await getFilmRecommendationsByCompany(input),
            onDone: async (ctx, response) => await parseRecommendations(ctx, `🎬 Фільми для перегляду ${input}:`, response),
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
            asyncTask: async () => await getCoopFilmRecommendations(
                userOneIncludeFilms,
                userOneExcludeFilms,
                userTwoIncludeFilms,
                userTwoExcludeFilms,
            ),
            onDone: async (ctx, response) => await parseRecommendations(ctx, '🎬 Я знайшов для вас фільми, які сподобаються обом:', response),
        });
    }
});

filmCardControls(scene);

scene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default scene;
