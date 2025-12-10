import { Markup } from 'telegraf';
import { UserService } from '../../services/UserService.js';
import { Film } from '../../models/index.js';
import { FilmService } from '../../services/FilmService.js';
import { LibraryService } from '../../services/LibraryService.js';

export async function setRateLibrary(ctx) {
    const rate = parseInt(ctx.match[1]);
    const filmId = parseInt(ctx.match[2]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    const film = await Film.findById(filmId);
    await FilmService.addToLibrary(user._id, filmId, 'watched', rate);

    await ctx.answerCbQuery();

    const rating = await LibraryService.getRating(user._id, filmId);
    const userRating = rating ? `Твоя оцінка: ⭐ ${rating}/10\n\n` : ``;

    const caption =
        `🎬 *${film.title}*${film.year ? ` (${film.year})` : ''}\n\n` +
        userRating +
        `${film.description || 'Опис відсутній.'}`;

    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('📺 На потім', `MARK_WATCH_LATER_${filmId}`),
        ],
        [Markup.button.callback('⭐ Змінити оцінку', `CHANGE_MARK_${filmId}`)],
        [Markup.button.callback('👾 Знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    const keyboardOptions = {
        parse_mode: 'Markdown',
        ...keyboard,
    };
    try {
        if (film.posterUrl) {
            await ctx.editMessageMedia(
                {
                    type: 'photo',
                    media: film.posterUrl,
                },
            );
            await ctx.editMessageCaption(caption, keyboardOptions);
        } else {
            await ctx.editMessageText(caption, keyboardOptions);
        }
    } catch {
        if (film.posterUrl) {
            await ctx.replyWithPhoto(film.posterUrl, {
                caption,
                ...keyboardOptions,
            });
        } else {
            await ctx.reply(caption, keyboardOptions);
        }
    }
}
