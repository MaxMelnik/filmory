import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { handleAddFilm, handleFilmDescriptionInput, handleFilmTitleInput, searchNewFilmByUserDescription } from '../handlers/addFilm.js';
import { addAsWatched } from '../handlers/addAsWatched.js';
import { addAsWatchLater } from '../handlers/addAsWatchLater.js';
import { saveManual } from '../handlers/saveManual.js';
import { setRateAddFilm } from '../handlers/setRateAddFilm.js';
import { openSearchFilmCard } from '../handlers/openSearchFilmCard.js';
import { recommendSimilar } from '../handlers/recommendSimilar.js';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import logger from '../../utils/logger.js';
import { shareFilmLink } from '../handlers/shareFilmLink.js';

const scene = new Scenes.BaseScene('ADD_FILM_SCENE_ID');

// Enter addFilm Scene
scene.enter(async (ctx) => {
    await handleAddFilm(ctx);
});

scene.on(message('text'), async (ctx) => {
    if (await handleCommandsOnText(ctx, ctx.message?.text?.trim())) return;
    const inputType = ctx.scene?.state?.inputType;
    if (inputType === 'title') return await handleFilmTitleInput(ctx);
    if (inputType === 'description') return await handleFilmDescriptionInput(ctx);
});

scene.action('SEARCH_NEW_BY_DESCRIPTION', async (ctx) => await searchNewFilmByUserDescription(ctx));

// Film Recs keyboard handlers
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

scene.action('ADD_WATCH_LATER', async (ctx) => addAsWatchLater(ctx));

scene.action('ADD_WATCHED', async (ctx) => addAsWatched(ctx));

scene.action(/^RATE_(\d+)_(\d+)$/, async (ctx) => setRateAddFilm(ctx));

scene.action('SAVE_MANUAL', async (ctx) => saveManual(ctx));

scene.action(/^RECOMMEND_(\d+)$/, async (ctx) => recommendSimilar(ctx));

scene.action(/^SHARE_(\d+)$/, async (ctx) => shareFilmLink(ctx));

// === Вихід зі сцени ===
scene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default scene;
