import { Scenes, Markup } from 'telegraf';
import { Film } from '../../models/index.js';
import { showLibraryPage } from '../../utils/keyboards/showLibraryPage.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getFilmRecommendations } from '../../services/integrations/geminiService.js';

const scene = new Scenes.BaseScene('LIBRARY_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
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

scene.action(/^OPEN_FILM_(\d+)$/, async (ctx) => {
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
        Markup.button.callback('⭐ Змінити оцінку', `CHANGE_MARK_${filmId}`),
        Markup.button.callback('⏳ Подивитись пізніше', `MARK_WATCH_LATER_${filmId}`),
    ] :
        [
            Markup.button.callback('👁 Переглянуто', `MARK_WATCHED_${filmId}`),
        ];

    const keyboard = Markup.inlineKeyboard([
        statusButtons,
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
});

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

scene.action('BACK_TO_LIBRARY', (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('LIBRARY_SCENE_ID');
});

scene.action('GO_BACK', (ctx) => {
    ctx.answerCbQuery();
    ctx.scene.enter('START_SCENE_ID');
});

export default scene;
