import { Scenes, session } from 'telegraf';
import { registerPaymentHandlers } from './handlers/payments.js';
import getBotInstance from './getBotInstance.js';

// === Scenes ===
import startScene from './scenes/startScene.js';
import addFilmScene from './scenes/addFilmScene.js';
import libraryScene from './scenes/libraryScene.js';
import recommendationScene from './scenes/recommendationScene.js';
import subscriptionsScene from './scenes/subscriptionsScene.js';
import rootScene from './scenes/rootScene.js';
import { activityMiddleware } from './middlewares/activityMiddleware.js';
import { UserService } from '../services/UserService.js';
import logger from '../utils/logger.js';
import parseRecommendations from '../utils/parseRecommendations.js';
import { plusOnlyRestriction } from './handlers/recommendationsCategories.js';
import DailyRecommendationService from '../services/DailyRecommendationService.js';
import { Film } from '../models/index.js';
import mongoose from 'mongoose';

// === Ініціалізація ===
const bot = getBotInstance();

// === Конфігурація сцен ===
const stage = new Scenes.Stage([
    startScene,
    addFilmScene,
    libraryScene,
    recommendationScene,
    subscriptionsScene,
    rootScene,
]);

bot.use(session());
bot.use(stage.middleware());

registerPaymentHandlers(bot);
bot.use(activityMiddleware());

// === Обробка помилок ===
bot.catch(async (err, ctx) => {
    logger.error('❌ Bot error:', err);

    if (err.name === 'TimeoutError') {
        logger.warn('⏳ Telegram API call timed out. Skipping...');
        return;
    }

    try {
        const chatType = ctx.update.message?.chat?.type;
        const userId = ctx.update.message?.from?.id;

        if (chatType === 'private') {
            await ctx.reply('⚠️ Щось пішло не так. Перезапускаю сеанс…').catch((e) => {
                if (e.code === 403) {
                    logger.warn(`🚫 Користувач ${userId} заблокував бота.`);
                } else {
                    logger.error('Помилка при відповіді користувачу:', e);
                }
            });

            await ctx.scene.enter('START_SCENE_ID').catch((e) => {
                logger.error('Не вдалося перейти до стартової сцени:', e);
            });
        }
    } catch (e) {
        logger.error('Внутрішня помилка в catch:', e);
    }
});

// === Маршрути / entry points ===
bot.start(async (ctx) => {
    const payload = ctx.startPayload;
    if (payload && payload.startsWith('movie_')) {
        const user = await UserService.getOrCreateUserFromCtx(ctx);
        logger.info(`Start with payload by @${user.username || user.telegramId}: ${payload}`);

        ctx.session.filmId = payload.slice('movie_'.length);
        return ctx.scene.enter('ADD_FILM_SCENE_ID');
    }

    ctx.scene.enter('START_SCENE_ID');
});

// bot.command('test', async (ctx) => ctx.reply(await UserService.isPlus(ctx.from.id)));

bot.command('root', async (ctx) => {
    if (await UserService.isRoot(ctx.from.id)) ctx.scene.enter('ROOT_SCENE_ID');
});

bot.command('test', async (ctx) => {
    logger.info(ctx.from);
});

bot.command('add', (ctx) => ctx.scene.enter('ADD_FILM_SCENE_ID'));

bot.command('my_films', (ctx) => ctx.scene.enter('LIBRARY_SCENE_ID'));

bot.command('recommend', (ctx) => ctx.scene.enter('RECOMMENDATION_SCENE_ID'));

bot.command('plus', (ctx) => ctx.scene.enter('SUBSCRIPTIONS_SCENE_ID'));

bot.action('ADD_FILM', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('ADD_FILM_SCENE_ID');
});

bot.action('SHOW_LIST', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('LIBRARY_SCENE_ID');
});

bot.action('GET_RECS', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('RECOMMENDATION_SCENE_ID');
});

bot.action('GET_SUBSCRIPTION', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('SUBSCRIPTIONS_SCENE_ID');
});

bot.action(/^SELECT_ACTIVE_REC_(\d+)$/, async (ctx) => {
    ctx.session.activeRecommendation = parseInt(ctx.match[1]);

    const { finalText, keyboard } = parseRecommendations(ctx);

    ctx.answerCbQuery();
    await ctx.editMessageText(
        finalText,
        {
            parse_mode: 'Markdown',
            ...keyboard,
        },
    ).catch(async () => {
        await ctx.reply(finalText, { parse_mode: 'Markdown', ...keyboard });
    });
});

bot.action('DELETE_THIS_MESSAGE', (ctx) => {
    ctx.deleteMessage();
});

bot.action('GO_HOME_AND_CLEAR_KEYBOARD', (ctx) => {
    ctx.editMessageReplyMarkup();
    ctx.session.editMessageText = false;
    ctx.scene.enter('START_SCENE_ID');
});

bot.action('GO_HOME_AND_DELETE_MESSAGE', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('START_SCENE_ID');
});

bot.action('GO_RECS_AND_DELETE_MESSAGE', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('RECOMMENDATION_SCENE_ID');
});

bot.action('GO_SEARCH_FILM_AND_DELETE_MESSAGE', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.editMessageText = true;
    ctx.scene.enter('ADD_FILM_SCENE_ID');
});

bot.action('PLUS_REC_CAT', async (ctx) => await plusOnlyRestriction(ctx));

bot.action('FAKE_BUTTON', (ctx) => ctx.answerCbQuery());

// === Експорт інстансу ===
export default bot;
