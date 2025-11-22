import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';
import { Markup } from 'telegraf';

export async function markWatched(ctx) {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, filmId, 'watched');
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('📺 На потім', `MARK_WATCH_LATER_${filmId}`),
        ],
        [Markup.button.callback('⭐ Змінити оцінку', `CHANGE_MARK_${filmId}`)],
        [Markup.button.callback('🤖 Знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    await ctx.editMessageReplyMarkup(keyboard.reply_markup);
}
