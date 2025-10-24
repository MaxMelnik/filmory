// backend/src/bot/handlers/start.js
// import User from '../../models/User.js';

export async function handleStart(ctx) {
    try {
        // const telegramId = String(ctx.from.id);
        // let user = await User.findOne({telegramId});
        //
        // if (!user) {
        //     user = await User.create({
        //         telegramId,
        //         username: ctx.from.username,
        //         firstName: ctx.from.first_name,
        //         lastName: ctx.from.last_name,
        //     });
        //     console.log(`[NEW USER] ${user.username || user.telegramId}`);
        // }

        const text = `
🎬 *Вітаємо у Filmory\\!*

Тут ти можеш:
• Зберігати фільми, які вже переглянув;
• Додавати стрічки до “подивитись пізніше”;
• Отримувати персональні рекомендації ⭐
    `;

        await ctx.replyWithMarkdownV2(text, {
            reply_markup: {
                inline_keyboard: [
                    [{text: '➕ Додати фільм', callback_data: 'add_film'}],
                    [{text: '📋 Мій список', callback_data: 'show_list'}],
                    [{text: '⭐ Рекомендації', callback_data: 'get_recs'}],
                ],
            },
        });
    } catch (err) {
        console.error('❌ Error in /start:', err);
        await ctx.reply('Сталася помилка при запуску Filmory 😢');
    }
}
