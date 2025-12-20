import getBotInstance from '../../bot/getBotInstance.js';

const bot = getBotInstance();

export async function postMovieToChannel(posterUrl, caption, keyboard) {
    await bot.telegram.sendPhoto(
        process.env.FILMORY_CHANNEL_ID,
        posterUrl,
        {
            caption,
            parse_mode: 'MarkdownV2',
            reply_markup: {
                inline_keyboard: keyboard,
            },
        },
    );
}
