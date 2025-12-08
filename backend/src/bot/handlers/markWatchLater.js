import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';
import { Markup } from 'telegraf';

export async function markWatchLater(ctx) {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, filmId, 'watch_later');
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('👁 Переглянуто', `MARK_WATCHED_${filmId}`),
        ],
        [Markup.button.callback('👾 знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    await ctx.editMessageReplyMarkup(keyboard.reply_markup);
}
