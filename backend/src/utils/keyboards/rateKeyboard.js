import { Markup } from 'telegraf';
import { UserService } from '../../services/UserService.js';
import { LibraryService } from '../../services/LibraryService.js';

export async function rateKeyboard(filmId, telegramId) {
    const user = await UserService.getByTelegramId(telegramId);
    const rating = await LibraryService.getRating(user._id, filmId); // може бути null

    const buttons = [];

    for (let i = 1; i <= 10; i++) {
        const label = (rating === i) ? `${i}⭐` : String(i);
        const callbackData = `RATE_${i}_${filmId}`;
        buttons.push(Markup.button.callback(label, callbackData));
    }

    // Розбиваємо по 5 в ряд
    const rows = [buttons.slice(0, 5), buttons.slice(5, 10)];

    return Markup.inlineKeyboard(rows);
}
