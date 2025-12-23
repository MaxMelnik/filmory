import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import { message } from 'telegraf/filters';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { pingGeminiAPI } from '../handlers/pingGeminiAPI.js';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import { getMovieDetails, searchFilm } from '../../services/integrations/tmdbClient.js';
import { AiRequestLog, LibraryItem, User } from '../../models/index.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import formatDate from '../../utils/formatDate.js';
import splitTelegramMessage from '../../utils/splitTelegramMessage.js';

const scene = new Scenes.BaseScene('ROOT_SCENE_ID');

// Enter Root scene
scene.enter(async (ctx) => {
    logger.info(`[ROOT SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 General Statistics', 'GENERAL_STATS')],
        [Markup.button.callback('👥 Users', 'USERS_LIST')],
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

scene.action('USERS_LIST', async (ctx) => {
    const users = await User
        .find({})
        .sort({ aiRequestsTotal: -1 })
        .lean();
    let output = `👥 Всього користувачів: ${users.length}\n\n`;

    let i = 1;
    for (const user of users) {
        const name = user.lastName ?
            `${user.firstName} ${user.lastName}` :
            `${user.firstName}`;

        const linkedName = `[${escapeReservedCharacters(name)}](tg://user?id=${user.telegramId})`;

        const filmsCount = await LibraryItem
            .find({ userId: user._id })
            .countDocuments();

        output += `${i}\\. 🙍🏻‍♂️ ${linkedName} ${user.username ? `@${escapeReservedCharacters(user.username)}` : ``} ${user.telegramId}\n` +
            `AI\\-requests: ${user.aiRequestsTotal} 👾\n` +
            `Films saved: ${filmsCount} 🎬 \n` +
            `Joined: ${escapeReservedCharacters(formatDate(user.firstSeenAt))} 🤝\n` +
            `Last Active: ${escapeReservedCharacters(formatDate(user.lastActiveAt))} 👀\n\n`;
        i++;
    }
    const messages = splitTelegramMessage(output);
    for (const message of messages) {
        await ctx.replyWithMarkdownV2(message);
    }
    return await ctx.answerCbQuery();
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
