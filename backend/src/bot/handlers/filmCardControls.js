import logger from '../../utils/logger.js';
import { handleFilmTitleInput } from './addFilm.js';
import { openSearchFilmCard } from './openSearchFilmCard.js';
import { addAsWatchLater } from './addAsWatchLater.js';
import { addAsWatched } from './addAsWatched.js';
import { setRateAddFilm } from './setRateAddFilm.js';
import { saveManual } from './saveManual.js';
import { recommendSimilar } from './recommendSimilar.js';
import { shareFilmLink } from './shareFilmLink.js';

export default function filmCardControls(scene) {
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
}
