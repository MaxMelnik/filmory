import { Scenes, Markup } from 'telegraf';
import getBotInstance from '../getBotInstance.js';
import generateProgressBar from '../../utils/generateProgressBar.js';
import { User } from '../../models/index.js';
import logger from '../../utils/logger.js';
import { UserService } from '../../services/UserService.js';

const bot = getBotInstance();

const usersArrayMock = [1, 0];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculatePercentage(count, total) {
    if (total === 0) {
        return 0; // To avoid division by zero
    }
    return Math.round((count / total) * 100);
}

// Mailing scene
const scene = new Scenes.BaseScene('SEND_SPAM_SCENE_ID');

scene.enter(async (ctx) => {
    logger.info(`[SEND SPAM SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    ctx.scene.session.isSpamAllowed = true;
    const usersCount = ctx.session.usersArray?.length ?? `всім ${await User.countDocuments()}`;
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🥺 Plzb, return', 'SEND_RETURN_MAILING')],
        [Markup.button.callback('🎁 Promo gift', 'SEND_PROMO_GIFT')],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);
    await ctx.reply(
        `Надішли зображення з описом або повідомлення, щоб розіслати його ${usersCount} користувачам.`,
        keyboard,
    );
});

// scene.on('photo', async (ctx) => {
//     if (!ctx.scene.session.isSpamAllowed) return ctx.scene.enter('ADMIN_SCENE_ID');
//     const lang = ctx.session.languageCode;
//
//     // const usersArray = usersArrayMock;
//
//     ctx.scene.session.fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id; // Get the highest resolution image
//     ctx.scene.session.description = ctx.message.caption || ''; // Get the description (if available)
//
//     // Log the received fileId and description
//     console.log('Image fileId:', ctx.scene.session.fileId);
//     console.log('Description:', ctx.scene.session.description);
//
//     const submitKeyboard = Markup.inlineKeyboard([
//         [Markup.button.callback(t.get('button.submit_sending', lang), `submit_sending`)],
//         [Markup.button.callback(t.get('button.return', lang), `return`)],
//     ]);
//     await ctx.reply(t.get('message.mailing.message_example', lang));
//     await bot.telegram.sendPhoto(ctx.from.id, ctx.scene.session.fileId, {
//         caption: ctx.scene.session.description, // Send the same description
//         reply_markup: submitKeyboard.reply_markup,
//     });
// });
//
// scene.on('text', async (ctx) => {
//     if (!ctx.scene.session.isSpamAllowed) return ctx.scene.enter('START_SCENE_ID');
//     // const usersArray = usersArrayMock;
//
//     const text = ctx.message.text || '';
//     ctx.scene.session.text = text;
//
//     // Log the received text
//     console.log('Text:', text);
//
//     await ctx.reply(t.get('message.mailing.message_example', lang));
//
//     const submitKeyboard = Markup.inlineKeyboard([
//         [Markup.button.callback(t.get('button.submit_sending', lang), `submit_sending`)],
//         [Markup.button.callback(t.get('button.return', lang), `return`)],
//     ]);
//     return ctx.reply(text, submitKeyboard);
// });

scene.action('SEND_RETURN_MAILING', async (ctx) => {
    if (!ctx.scene.session.isSpamAllowed) return ctx.scene.enter('START_SCENE_ID');

    const text = `🎬 Привіт! Це Filmory 💡

Щоб тобі було простіше обрати фільм, я створив канал @film_memory_channel – там готові ідеї на вечір: щоденні тематичні підбірки + інколи добірки “для своїх” 👀

Хочеш персональну рекомендацію прямо зараз – тисни «Підібрати фільм» 😊🍿`;

    ctx.scene.session.text = text;

    // Log the received text
    logger.info(`Text:\n\n ${text}`);

    await ctx.reply('Буде розіслано наступне повідомлення:');

    const submitKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Підтвердити відправку', `SUBMIT_SENDING`)],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);
    ctx.reply(text, submitKeyboard);
    ctx.answerCbQuery();
});

scene.action('SEND_PROMO_GIFT', async (ctx) => {
    if (!ctx.scene.session.isSpamAllowed) return ctx.scene.enter('START_SCENE_ID');
    // ctx.session.usersArray = [await UserService.getByTelegramId('396424453')];
    ctx.session.usersArray = [await UserService.getByTelegramId('6180459605')];

    const text = `🎉 Happy Birthday!

Сьогодні ти — головний герой дня 🎬
Тому Filmory дарує тобі маленький бонус:

🍿 Plus підписку!

Схожий ти на мавпу, пахнеш точно як вона!`;

    ctx.scene.session.text = text;

    // Log the received text
    logger.info(`Text:\n\n ${text}`);

    await ctx.reply('Буде розіслано наступне повідомлення:');

    const submitKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Підтвердити відправку', `SUBMIT_SENDING`)],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);
    ctx.reply(text, submitKeyboard);
    ctx.answerCbQuery();
});

scene.action('SUBMIT_SENDING', async (ctx) => {
    logger.info(`SUBMIT_SENDING:` + ctx.scene.session.text + ctx.scene.session.fileId + ctx.scene.session.description);
    ctx.scene.session.isSpamAllowed = false;

    if (!ctx.scene.session.fileId) {
        const text = ctx.scene.session.text;

        const usersArray = ctx.session.usersArray ?? await User.find();
        // const usersArray = usersArrayMock;
        ctx.session.usersArray = null;
        let successful = 0;
        let failed = 0;
        const total = usersArray.length;

        let progressBar = generateProgressBar(calculatePercentage(successful + failed, total));
        const message = await ctx.reply(`Розсилка займе певний час\n\n` + progressBar);
        // Send the message to each user in the usersArray
        for (const userId of usersArray) {
            const user = await User.findOne({ _id: userId });
            try {
                await bot.telegram.sendMessage(
                    user.telegramId,
                    text,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('⭐ Дякую!', 'GO_RECS')],
                        // [Markup.button.url('📽 Канал із фільмами', 'https://t.me/film_memory_channel')],
                        // [Markup.button.callback('👾 Підібрати фільм', 'GO_RECS')],
                    ]),
                );
                successful++;
                logger.info(`Sent message to user: ${user.telegramId}`);
            } catch (error) {
                failed++;
                logger.warn(`Failed to send message to user ${user?.telegramId}:\n\n${error}`);
            }
            progressBar = generateProgressBar(calculatePercentage(successful + failed, total));
            const messageText = `Розсилка займе певний час\n\n` + progressBar;
            await ctx.telegram.editMessageText(ctx.from.id, message.message_id, undefined, messageText);
            await sleep(500);
        }

        logger.info(`Sent successful: ${successful}`);
        logger.info(`Sent failed: ${failed}`);
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]);
        await ctx.reply(`Повідомлення отримали ✅ ${successful} користувачів. Не вдалось надіслати ❌ ${failed} користувачам`, keyboard);
        return ctx.answerCbQuery();
    }

    // const fileId = ctx.scene.session.fileId;
    // const description = ctx.scene.session.description;
    //
    // const usersArray = ctx.session.usersArray ? ctx.session.usersArray : await User.find();
    // ctx.session.usersArray = null;
    // let successful = 0;
    // let failed = 0;
    // const total = usersArray.length;
    //
    // let progressBar = generateProgressBar(calculatePercentage(successful + failed, total));
    // const message = await ctx.reply(t.get('message.mailing.processing', lang) + `\r\n\r\n` + progressBar);
    // // Send the image to each user in the usersArray
    // for (const userId of usersArray) {
    //     const user = await User.findOne({ _id: userId });
    //     try {
    //         await bot.telegram.sendPhoto(user.telegramId, fileId, {
    //             caption: description, // Send the same description
    //         });
    //         successful++;
    //         console.log(`Sent image to user: ${user.telegramId}`);
    //     } catch (error) {
    //         failed++;
    //         console.error(`Failed to send image to user ${user.telegramId}:`, error);
    //     }
    //     progressBar = generateProgressBar(calculatePercentage(successful + failed, total));
    //     const messageText = t.get('message.mailing.processing', lang) + `\r\n\r\n` + progressBar;
    //     try {
    //         await ctx.telegram.editMessageText(ctx.from.id, message.message_id, undefined, messageText);
    //     } catch (e) {
    //         // message didn't change
    //     }
    //     await sleep(50);
    // }
    // const admin = await AdminService.findAdminByTelegramId(ctx.from.id);
    // const adminStatistics = await AdminStatisticsService.getCurrentMonthStatisticsByAdminId(admin._id);
    // adminStatistics.spamsSent += successful;
    // await adminStatistics.save();
    //
    // console.log(`Sent successful: ${successful}`);
    // console.log(`Sent failed: ${failed}`);
    // const keyboard = Markup.inlineKeyboard([
    //     [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    // ]);
    // return await ctx.reply(t.get('message.mailing.successful', lang, { successful }), keyboard);
});

export default scene;
