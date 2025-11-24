import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';

const scene = new Scenes.BaseScene('ROOT_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    console.log(`[ROOT SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 General Statistics', 'GENERAL_STATS')],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);
    ctx.reply(
        '> Welcome to ROOT!',
        keyboard);
});

scene.action('GENERAL_STATS', async (ctx) => {
    const telegramId = ctx.from.id;

    const [mau, req30, plusReq30, freeReq30, rootReq30] = await Promise.all([
        AnalyticsService.getMau(30),
        AnalyticsService.getAiRequestsCount({ days: 30 }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'PLUS' }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'FREE' }),
        AnalyticsService.getAiRequestsCount({ days: 30, plan: 'ROOT' }),
    ]);

    await ctx.reply(
        `Статистика за 30 днів:\n` +
        `• MAU: ${mau}\n` +
        `• Всього AI-запитів: ${req30}\n` +
        `   – від Plus: ${plusReq30}\n` +
        `   – від Free: ${freeReq30}\n` +
        `   – від Root: ${rootReq30}`,
    );
});

export default scene;
