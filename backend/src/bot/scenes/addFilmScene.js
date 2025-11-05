import {Markup, Scenes} from 'telegraf';
import {message} from 'telegraf/filters';
import {handleAddFilm, handleFilmTitleInput} from '../handlers/addFilm.js';
import {FilmService} from '../../services/FilmService.js';
import {UserService} from '../../services/UserService.js';

const scene = new Scenes.BaseScene('ADD_FILM_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    await handleAddFilm(ctx);
});

// === Обробка тексту (назва фільму) ===
scene.on(message('text'), async (ctx) => {
    await handleFilmTitleInput(ctx);
});

// === Додати у "Подивитись пізніше" ===
scene.action('ADD_WATCH_LATER', async (ctx) => {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    const user = await UserService.getByTelegramId(ctx.from.id);
    console.log(film);
    await FilmService.addToLibrary(user._id, film._id, 'watch_later');

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(`🎬 Додав <b>${film.title}</b> до списку “подивитись пізніше”!`, {
        parse_mode: 'HTML',
    });
    await ctx.scene.leave();
});

// === Вже переглянуто → показати оцінку ===
scene.action('ADD_WATCHED', async (ctx) => {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();

    const ratingKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('1', 'RATE_1'),
            Markup.button.callback('2', 'RATE_2'),
            Markup.button.callback('3', 'RATE_3'),
            Markup.button.callback('4', 'RATE_4'),
            Markup.button.callback('5', 'RATE_5'),
        ],
        [
            Markup.button.callback('6', 'RATE_6'),
            Markup.button.callback('7', 'RATE_7'),
            Markup.button.callback('8', 'RATE_8'),
            Markup.button.callback('9', 'RATE_9'),
            Markup.button.callback('10⭐', 'RATE_10'),
        ],
    ]);

    await ctx.reply(
        `✅ Позначив <b>${film.title}</b> як переглянутий!\n\nОціни його від 1 до 10:`,
        {parse_mode: 'HTML', ...ratingKeyboard},
    );
});

// === Обробка вибору рейтингу ===
for (let i = 1; i <= 10; i++) {
    scene.action(`RATE_${i}`, async (ctx) => {
        const film = ctx.scene.state.film;
        if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');
        const user = await UserService.getByTelegramId(ctx.from.id);
        await FilmService.addToLibrary(user._id, film._id, 'watched', i);

        await ctx.answerCbQuery();
        await ctx.editMessageReplyMarkup();
        await ctx.reply(
            `⭐ Оцінив <b>${film.title}</b> на ${i}/10. Гарний вибір!`,
            {parse_mode: 'HTML'},
        );
        await ctx.scene.leave();
    });
}

scene.action('SAVE_MANUAL', async (ctx) => {
    const title = ctx.session.title;
    ctx.session.title = null;
    ctx.scene.state.film = await FilmService.createManual(title);
    await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🎞 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);

    try {
        if (ctx.update.callback_query.message.photo) {
            await ctx.editMessageCaption({
                caption: `“${title}”\n\nЩо зробимо з цим фільмом?`,
                reply_markup: keyboard.reply_markup,
            });
        } else {
            await ctx.editMessageText(`“${title}”\n\nЩо зробимо з цим фільмом?`, keyboard);
        }
    } catch (e) {
        console.error('⚠️ Не вдалося оновити повідомлення:', e.message);
    }
});

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
