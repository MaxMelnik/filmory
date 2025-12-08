import { Scenes } from 'telegraf';
import { showPersonalRecommendations } from '../handlers/showPersonalRecommendations.js';
import { handleFilmTitleInput } from '../handlers/addFilm.js';
import logger from '../../utils/logger.js';
import { openSearchFilmCard } from '../handlers/openSearchFilmCard.js';
import { addAsWatchLater } from '../handlers/addAsWatchLater.js';
import { addAsWatched } from '../handlers/addAsWatched.js';
import { setRateAddFilm } from '../handlers/setRateAddFilm.js';
import { saveManual } from '../handlers/saveManual.js';
import { showRecommendationsMenu } from '../handlers/showRecommendationsMenu.js';
import { showSimilarRecommendations } from '../handlers/showSimilarRecommendations.js';

const scene = new Scenes.BaseScene('RECOMMENDATION_SCENE_ID');

// Enter Recommendations Scene
scene.enter(async (ctx) => await showRecommendationsMenu(ctx));

scene.action('PERSONAL_REC_CAT', async (ctx) => await showPersonalRecommendations(ctx));

scene.action('SIMILAR_REC_CAT', async (ctx) => await showSimilarRecommendations(ctx));

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
