import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import { message } from 'telegraf/filters';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { pingGeminiAPI } from '../handlers/pingGeminiAPI.js';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import { getMovieDetails, searchFilm } from '../../services/integrations/tmdbClient.js';
import { AiRequestLog, User } from '../../models/index.js';

const scene = new Scenes.BaseScene('ROOT_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    logger.info(`[ROOT SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 General Statistics', 'GENERAL_STATS')],
        [Markup.button.callback('🙍‍♂️ User', 'USER_INFO')],
        [Markup.button.callback('🏓️ PING GEMINI AI', 'PING_GEMINI_API')],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);
    ctx.reply(
        '> Welcome to ROOT!',
        keyboard);
});

scene.action('GENERAL_STATS', async (ctx) => {
    const totalUsersCount = await User.countDocuments();
    const totalReq = await AiRequestLog.countDocuments();

    const [mau, req30, freeReq30, plusReq30, promoReq30, rootReq30] = await Promise.all([
        AnalyticsService.getMau(30),
        AnalyticsService.getAiRequestsCount({ days: 30 }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'FREE' }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'PLUS' }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'PROMO' }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'ROOT' }),
    ]);

    ctx.answerCbQuery();
    await ctx.reply(
        `Всього користувачів: ${totalUsersCount}\n` +
        `Всього AI-запитів: ${totalReq}\n\n` +
        `Статистика за 30 днів:\n` +
        `• MAU: ${mau}\n` +
        `• AI-запитів: ${req30}\n` +
        `   – від Free: ${freeReq30}\n` +
        `   – від Plus: ${plusReq30}\n` +
        `   – від Promo: ${promoReq30}\n` +
        `   – від Root: ${rootReq30}`,
        Markup.inlineKeyboard([
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]),
    );
});

scene.action('USER_INFO', async (ctx) => {
    ctx.scene.state.awaitingTelegramId = true;
    ctx.reply('> Введіть telegramId');
});

scene.action('PING_GEMINI_API', async (ctx) => {
    await pingGeminiAPI(ctx);
});

scene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();
    if (await handleCommandsOnText(ctx, input)) return;

    if (ctx.scene.state.awaitingTelegramId) {
        ctx.scene.state.awaitingTelegramId = false;
        const user = await UserService.getByTelegramId(input);
        return ctx.reply(user);
    }

    const movie = await searchFilm(input);
    const details = await getMovieDetails(movie.tmdbId);

    ctx.reply(details);
});

export default scene;
