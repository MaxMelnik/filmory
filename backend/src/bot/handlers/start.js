import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';

export async function handleStart(ctx) {
    try {
        const telegramId = ctx.from.id;
        const user = await UserService.getOrCreateUserFromCtx(ctx);
        logger.info(`[START SCENE ENTERED] @${user.username || user.telegramId}`);

        const text = `
🎬 *Вітаю у Filmory\\!*

Тут ти можеш:
• Зберігати фільми, які вже переглянув;
• Додавати стрічки до “подивитись пізніше”;
• Отримувати особисті рекомендації ⭐
    `;

        const subscriptionButtonLabel = await UserService.isPlus(telegramId) ?
            '✅ Plus активний' :
            '⭐ Filmory Plus';

        const keyboard = [
            [{ text: '➕ Додати фільм', callback_data: 'ADD_FILM' }],
            [{ text: '📋 Мій список', callback_data: 'SHOW_LIST' }],
            [{ text: '🤖 Рекомендації', callback_data: 'GET_RECS' }],
            [{ text: subscriptionButtonLabel, callback_data: 'GET_SUBSCRIPTION' }],
        ];

        await ctx.replyWithMarkdownV2(text, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    } catch (err) {
        logger.error('❌ Error in /start:', err);
        await ctx.reply('Сталася помилка при запуску Filmory 😢');
    }
}
