import { Film } from '../../models/index.js';
import { Markup } from 'telegraf';

export async function openLibraryFilmCard(ctx) {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const film = await Film.findById(filmId);

    if (!film) {
        await ctx.reply('❌ Не вдалося знайти фільм.');
        return;
    }

    const caption =
        `🎬 *${film.title}*${film.year ? ` (${film.year})` : ''}\n\n` +
        `${film.description || 'Опис відсутній.'}`;

    const statusButtons = (ctx.session.view === 'watched') ? [
        Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
        Markup.button.callback('📺 На потім', `MARK_WATCH_LATER_${filmId}`),
    ] :
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('👁 Переглянуто', `MARK_WATCHED_${filmId}`),
        ];

    const keyboard = Markup.inlineKeyboard([
        statusButtons,
        [Markup.button.callback('⭐ Змінити оцінку', `CHANGE_MARK_${filmId}`)],
        [Markup.button.callback('🛰️ Знайти схожі фільми', `RECOMMEND_${filmId}`)],
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
