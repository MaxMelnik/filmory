import { Film } from '../../models/index.js';
import { Markup } from 'telegraf';
import { LibraryService } from '../../services/LibraryService.js';
import { UserService } from '../../services/UserService.js';

export async function openLibraryFilmCard(ctx) {
    await ctx.answerCbQuery();
    const user = await UserService.getByTelegramId(ctx.from.id);
    let filmId = parseInt(ctx.match[1]);

    const film = filmId ? await Film.findById(filmId) : await LibraryService.getRandomUserFilms(user._id, 'watch_later');
    filmId = film._id;

    if (!film) {
        await ctx.reply('❌ Не вдалося знайти фільм.');
        return;
    }

    const rating = await LibraryService.getRating(user._id, filmId);
    const userRating = rating ? `Твоя оцінка: ⭐ ${rating}/10\n\n` : ``;
    const tmdbRating = film.tmdbRate ? `Оцінка TMDB: 💙 ${film.tmdbRate}/10\n\n` : ``;

    const caption =
        `🎬 *${film.title}* ${film.originalTitle ? ` / _${film.originalTitle}_ ` : ''}${film.year ? ` (${film.year})` : ''}\n\n` +
        userRating + tmdbRating +
        `${film.description || 'Опис відсутній.'}`;

    const statusButtons = (ctx.session.view === 'watched') ?
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('📺 На потім', `MARK_WATCH_LATER_${filmId}`),
        ] :
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('👁 Переглянуто', `MARK_WATCHED_${filmId}`),
        ];

    const keyboard = Markup.inlineKeyboard([
        statusButtons,
        (ctx.session.view === 'watched') ? [Markup.button.callback('⭐ Змінити оцінку', `CHANGE_MARK_${filmId}`)] : [],
        [Markup.button.callback('👾 Знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('🔗 Поділитись', `SHARE_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    if (film.posterUrl) {
        await ctx.replyWithPhoto(film.posterUrl, {
            caption,
            parse_mode: 'Markdown',
            ...keyboard,
        });
    } else {
        await ctx.reply(caption, { parse_mode: 'Markdown', ...keyboard });
    }
}
