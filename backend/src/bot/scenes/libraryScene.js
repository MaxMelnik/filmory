import { Markup, Scenes } from 'telegraf';
import { showLibraryPage } from '../../utils/keyboards/showLibraryPage.js';
import { openLibraryFilmCard } from '../handlers/openLibraryFilmCard.js';
import { Film } from '../../models/index.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getFilmRecommendations } from '../../services/integrations/geminiService.js';
import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';
import { LibraryService } from '../../services/LibraryService.js';

const scene = new Scenes.BaseScene('LIBRARY_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    console.log(`[LIBRARY SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    ctx.session.view = 'watchLater';
    ctx.session.page = 1;
    ctx.session.totalPages = null;
    await showLibraryPage(ctx);
});

scene.action('SWITCH_WATCH_LATER', async (ctx) => {
    ctx.session.view = 'watchLater';
    ctx.session.page = 1;
    await ctx.answerCbQuery('Переглядаєш “Подивитись пізніше”');
    await showLibraryPage(ctx);
});

scene.action('SWITCH_WATCHED', async (ctx) => {
    ctx.session.view = 'watched';
    ctx.session.page = 1;
    await ctx.answerCbQuery('Переглядаєш “Переглянуті”');
    await showLibraryPage(ctx);
});

scene.action('NEXT_PAGE', async (ctx) => {
    ctx.session.page++;
    if (ctx.session.page > ctx.session.totalPages) ctx.session.page = 1;
    await ctx.answerCbQuery();
    await showLibraryPage(ctx);
});

scene.action('PREV_PAGE', async (ctx) => {
    ctx.session.page--;
    if (ctx.session.page < 1) ctx.session.page = ctx.session.totalPages;
    await ctx.answerCbQuery();
    await showLibraryPage(ctx);
});

scene.action(/^OPEN_FILM_(\d+)$/, (ctx) => openLibraryFilmCard(ctx));

scene.action(/^RECOMMEND_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const film = await Film.findById(filmId);
    const movieName = film.title;
    console.log(`RECOMMEND_: ${movieName}`);
    await showWaiter(ctx, {
        message: `Шукаю фільми схожі на "${movieName}"`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getFilmRecommendations(movieName),
        onDone: (response) => `🎬 Фільми схожі на "${movieName}":\n\n${response}`,
    });
});

scene.action(/^MARK_WATCHED_(\d+)$/, async (ctx) => {
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
        [Markup.button.callback('🛰️ Знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    await ctx.editMessageReplyMarkup(keyboard.reply_markup);
});

scene.action(/^MARK_WATCH_LATER_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, filmId, 'watch_later');
    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('❌ Видалити', `DELETE_FROM_LIB_${filmId}`),
            Markup.button.callback('👁 Переглянуто', `MARK_WATCHED_${filmId}`),
        ],
        [Markup.button.callback('🛰️ Знайти схожі фільми', `RECOMMEND_${filmId}`)],
        [Markup.button.callback('⬅ Назад', 'BACK_TO_LIBRARY')],
    ]);

    await ctx.editMessageReplyMarkup(keyboard.reply_markup);
});

scene.action(/^CHANGE_MARK_(\d+)$/, async (ctx) => {
    const filmId = parseInt(ctx.match[1]);

    await ctx.answerCbQuery();

    const ratingKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('1', `RATE_1_${filmId}`),
            Markup.button.callback('2', `RATE_2_${filmId}`),
            Markup.button.callback('3', `RATE_3_${filmId}`),
            Markup.button.callback('4', `RATE_4_${filmId}`),
            Markup.button.callback('5', `RATE_5_${filmId}`),
        ],
        [
            Markup.button.callback('6', `RATE_6_${filmId}`),
            Markup.button.callback('7', `RATE_7_${filmId}`),
            Markup.button.callback('8', `RATE_8_${filmId}`),
            Markup.button.callback('9', `RATE_9_${filmId}`),
            Markup.button.callback('10⭐', `RATE_10_${filmId}`),
        ],
    ]);

    await ctx.editMessageReplyMarkup(ratingKeyboard.reply_markup);
});

scene.action(/^RATE_(\d+)_(\d+)$/, async (ctx) => {
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
        [Markup.button.callback('🛰️ Знайти схожі фільми', `RECOMMEND_${filmId}`)],
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
    } catch (err) {
        if (film.posterUrl) {
            await ctx.replyWithPhoto(film.posterUrl, {
                caption,
                ...keyboardOptions,
            });
        } else {
            await ctx.reply(caption, keyboardOptions);
        }
    }
});

scene.action(/^DELETE_FROM_LIB_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    await LibraryService.deleteFilmFromUserLibrary(user._id, filmId);

    await ctx.editMessageReplyMarkup();
    await ctx.scene.enter('LIBRARY_SCENE_ID');
});

scene.action('BACK_TO_LIBRARY', (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('LIBRARY_SCENE_ID');
});

scene.action('GO_BACK', (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('START_SCENE_ID');
});

export default scene;
