import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { handleAddFilm, handleFilmTitleInput } from '../handlers/addFilm.js';
import { addAsWatched } from '../handlers/addAsWatched.js';
import { addAsWatchLater } from '../handlers/addAsWatchLater.js';
import { saveManual } from '../handlers/saveManual.js';
import { setRateAddFilm } from '../handlers/setRateAddFilm.js';

const scene = new Scenes.BaseScene('ADD_FILM_SCENE_ID');

// Enter addFilm Scene
scene.enter(async (ctx) => {
    await handleAddFilm(ctx);
});

// === Обробка тексту (назва фільму) ===
scene.on(message('text'), async (ctx) => {
    await handleFilmTitleInput(ctx);
});

// === Додати у "Подивитись пізніше" ===
scene.action('ADD_WATCH_LATER', async (ctx) => addAsWatchLater(ctx));

// === Вже переглянуто → показати оцінку ===
scene.action('ADD_WATCHED', async (ctx) => addAsWatched(ctx));

// === Обробка вибору рейтингу ===
scene.action(/^RATE_(\d+)_(\d+)$/, async (ctx) => setRateAddFilm(ctx));

scene.action('SAVE_MANUAL', async (ctx) => saveManual(ctx));

// === "Back" button ===
scene.action('GO_BACK', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.scene.enter('START_SCENE_ID');
});

// === Вихід зі сцени ===
scene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default scene;
