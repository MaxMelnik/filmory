import { Markup, Scenes } from 'telegraf';
import { AnalyticsService } from '../../services/system/AnalyticsService.js';
import { message } from 'telegraf/filters';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import { pingGeminiAPI } from '../handlers/pingGeminiAPI.js';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import { getMovieDetails, getTvDetails, searchFilm } from '../../services/integrations/tmdbClient.js';
import { AiRequestLog, LibraryItem, User } from '../../models/index.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import formatDate from '../../utils/formatDate.js';
import splitTelegramMessage from '../../utils/splitTelegramMessage.js';
import postDailyRecommendation from '../../cron/postDailyRecommendation.js';
import getBotInstance from '../getBotInstance.js';

// Root scene
const scene = new Scenes.BaseScene('ROOT_SCENE_ID');

scene.enter(async (ctx) => {
    logger.info(`[ROOT SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 General Statistics', 'GENERAL_STATS')],
        [Markup.button.callback('👥 Users', 'USERS_LIST')],
        [Markup.button.callback('📧 Send Spam', 'SEND_SPAM')],
        [Markup.button.callback('🚀 Post Daily Rec', 'MANUAL_POST_DAILY_REC')],
        [Markup.button.callback('🏓️ PING GEMINI AI', 'PING_GEMINI_API')],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);
    ctx.reply(
        '> Welcome to ROOT!',
        keyboard);
});

scene.action('GENERAL_STATS', async (ctx) => {
    const totalUsersCount = await User.countDocuments();
    const totalReq = await AiRequestLog.countDocuments({
        plan: { $ne: 'ROOT' },
    });

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
        `Filmory💡 v${process.env.npm_package_version}\n` +
        `\n` +
        `Всього користувачів: ${totalUsersCount}\n` +
        `Всього AI-запитів: ${totalReq}\n` +
        `\n` +
        `Статистика за 30 днів:\n` +
        `• MAU: ${mau}\n` +
        `• AI-запитів: ${req30 - rootReq30}\n` +
        `   – від Free: ${freeReq30}\n` +
        `   – від Plus: ${plusReq30}\n` +
        `   – від Promo: ${promoReq30}\n` +
        `\n` +
        `• Root:\n` +
        `   – AI-запитів за 30 днів: ${rootReq30}\n`,
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

        const filmsWatchedCount = await LibraryItem
            .find({
                userId: user._id,
                status: 'watched',
            })
            .countDocuments();

        const filmsWatchLaterCount = await LibraryItem
            .find({
                userId: user._id,
                status: 'watch_later',
            })
            .countDocuments();

        output += `${i}\\. *🙍🏻‍♂️ ${linkedName} ${user.username ? `@${escapeReservedCharacters(user.username)}` : ``} ${user.telegramId}*\n` +
            `_AI\\-requests_: ${user.aiRequestsTotal ?? 0} 👾\n` +
            `_Films watched_: ${filmsWatchedCount} 👁 \n` +
            `_Films saved to watch later_: ${filmsWatchLaterCount} 📺 \n` +
            `_Random rolls_: ${user.randomRollsTotal ?? 0} 🎲\n` +
            `_Joined_: ${escapeReservedCharacters(formatDate(user.firstSeenAt))} 🤝\n` +
            `_Last Active_: ${escapeReservedCharacters(formatDate(user.lastActiveAt))} 👀\n\n`;
        i++;
    }
    const messages = splitTelegramMessage(output);
    for (const message of messages) {
        await ctx.replyWithMarkdownV2(message);
    }
    return await ctx.answerCbQuery();
});

const bot = getBotInstance();

scene.action('MANUAL_POST_DAILY_REC', async (ctx) => {
    await postDailyRecommendation(bot);
});

scene.action('PING_GEMINI_API', async (ctx) => {
    await pingGeminiAPI(ctx);
});

scene.action('SEND_SPAM', async (ctx) => ctx.scene.enter('SEND_SPAM_SCENE_ID'));

scene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();
    if (await handleCommandsOnText(ctx, input)) return;

    if (ctx.scene.state.awaitingTelegramId) {
        ctx.scene.state.awaitingTelegramId = false;
        const user = await UserService.getByTelegramId(input);
        return ctx.reply(user);
    }

    const movie = await searchFilm(input);
    const details = (movie.mediaType === 'movie') ?
        await getMovieDetails(movie.tmdbId) :
        await getTvDetails(movie.tmdbId);

    ctx.reply(details);
});

export default scene;
