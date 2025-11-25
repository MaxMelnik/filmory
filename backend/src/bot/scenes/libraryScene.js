import { Scenes } from 'telegraf';
import { showLibraryPage } from '../handlers/showLibraryPage.js';
import { openLibraryFilmCard } from '../handlers/openLibraryFilmCard.js';
import { deleteFromLibrary } from '../handlers/deleteFromLibrary.js';
import { markWatchLater } from '../handlers/markWatchLater.js';
import { markWatched } from '../handlers/markWatched.js';
import { recommendSimilar } from '../handlers/recommendSimilar.js';
import { changeMark } from '../handlers/changeMark.js';
import { setRateLibrary } from '../handlers/setRateLibrary.js';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';

const scene = new Scenes.BaseScene('LIBRARY_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    logger.info(`[LIBRARY SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    await UserService.getOrCreateUserFromCtx(ctx);
    ctx.session.view = 'watchLater';
    ctx.session.page = 1;
    ctx.session.totalPages = null;
    await showLibraryPage(ctx);
});

scene.action('SWITCH_WATCH_LATER', async (ctx) => {
    ctx.session.view = 'watchLater';
    ctx.session.page = 1;
    await ctx.answerCbQuery('Переглядаєш “Подивитись пізніше”');
    await showLibraryPage(ctx);
});

scene.action('SWITCH_WATCHED', async (ctx) => {
    ctx.session.view = 'watched';
    ctx.session.page = 1;
    await ctx.answerCbQuery('Переглядаєш “Переглянуті”');
    await showLibraryPage(ctx);
});

scene.action('NEXT_PAGE', async (ctx) => {
    ctx.session.page++;
    if (ctx.session.page > ctx.session.totalPages) ctx.session.page = 1;
    await ctx.answerCbQuery();
    await showLibraryPage(ctx);
});

scene.action('PREV_PAGE', async (ctx) => {
    ctx.session.page--;
    if (ctx.session.page < 1) ctx.session.page = ctx.session.totalPages;
    await ctx.answerCbQuery();
    await showLibraryPage(ctx);
});

scene.action(/^OPEN_FILM_(\d+)$/, (ctx) => openLibraryFilmCard(ctx));

scene.action(/^RECOMMEND_(\d+)$/, async (ctx) => recommendSimilar(ctx));

scene.action(/^MARK_WATCHED_(\d+)$/, async (ctx) => markWatched(ctx));

scene.action(/^MARK_WATCH_LATER_(\d+)$/, async (ctx) => markWatchLater(ctx));

scene.action(/^CHANGE_MARK_(\d+)$/, async (ctx) => changeMark(ctx));

scene.action(/^RATE_(\d+)_(\d+)$/, async (ctx) => setRateLibrary(ctx));

scene.action(/^DELETE_FROM_LIB_(\d+)$/, async (ctx) => deleteFromLibrary(ctx));

scene.action('BACK_TO_LIBRARY', (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('LIBRARY_SCENE_ID');
});

export default scene;
