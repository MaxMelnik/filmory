import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import { message } from 'telegraf/filters';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { pingGeminiAPI } from '../handlers/pingGeminiAPI.js';

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
        `Статистика за 30 днів:\n` +
        `• MAU: ${mau}\n` +
        `• Всього AI-запитів: ${req30}\n` +
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
    ctx.scene.session.awaitingTelegramId = true;
    ctx.reply('> Введіть telegramId');
});

scene.action('PING_GEMINI_API', async (ctx) => {
    await pingGeminiAPI(ctx);
    ctx.answerCbQuery();
})

scene.on(message('text'), async (ctx) => {
    if (!ctx.scene?.session?.awaitingTelegramId) return;

    const telegramId = ctx.message.text.trim();
    ctx.scene.session.awaitingTelegramId = false;

    const user = await UserService.getByTelegramId(telegramId);
    ctx.reply(user);
});

export default scene;
