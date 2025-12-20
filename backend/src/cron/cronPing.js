export default async (bot) => {
    await bot.telegram.sendMessage(
        '396424453',
        `PING by cron: ${new Date().toString().substring(0, 25)}`,
    );
};
