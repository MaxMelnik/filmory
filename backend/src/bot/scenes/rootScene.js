import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import { message } from 'telegraf/filters';
import { handleFilmTitleInput } from '../handlers/addFilm.js';
import { UserService } from '../../services/UserService.js';

const scene = new Scenes.BaseScene('ROOT_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    logger.info(`[ROOT SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 General Statistics', 'GENERAL_STATS')],
        [Markup.button.callback('🙍‍♂️ User', 'USER_INFO')],
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

    ctx.answerCbQuery();
    await ctx.reply(
        `Статистика за 30 днів:\n` +
        `• MAU: ${mau}\n` +
        `• Всього AI-запитів: ${req30}\n` +
        `   – від Plus: ${plusReq30}\n` +
        `   – від Free: ${freeReq30}\n` +
        `   – від Root: ${rootReq30}`,
    );
});

scene.action('USER_INFO', async (ctx) => {
    ctx.scene.session.awaitingTelegramId = true;
    ctx.reply('> Введіть telegramId');
});

scene.on(message('text'), async (ctx) => {
    if (!ctx.scene?.session?.awaitingTelegramId) return;

    const telegramId = ctx.message.text.trim();
    ctx.scene.session.awaitingTelegramId = false;

    const user = await UserService.getByTelegramId(telegramId);
    ctx.reply(user);
});

export default scene;
