import {Scenes, Markup} from 'telegraf';
import {message} from 'telegraf/filters';
import {handleAddFilm, handleFilmTitleInput} from '../handlers/addFilm.js';
import {LibraryItem} from '../../models/index.js';

const addFilmScene = new Scenes.BaseScene('ADD_FILM_SCENE_ID');

// === Вхід у сцену ===
addFilmScene.enter(async (ctx) => {
    await handleAddFilm(ctx);
});

// === Обробка тексту (назва фільму) ===
addFilmScene.on(message('text'), async (ctx) => {
    await handleFilmTitleInput(ctx);
});

// === Додати у "Подивитись пізніше" ===
addFilmScene.action('ADD_WATCH_LATER', async (ctx) => {
    const film = ctx.scene.state.film;
    if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

    await LibraryItem.updateOne(
        {user: ctx.from.id, film: film._id},
        {$set: {status: 'watch_later'}},
        {upsert: true},
    );

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(`🎬 Додав <b>${film.title}</b> до списку “подивитись пізніше”!`, {
        parse_mode: 'HTML',
    });
    await ctx.scene.leave();
});

// === Вже переглянуто → показати оцінку ===
addFilmScene.action('ADD_WATCHED', async (ctx) => {
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
    addFilmScene.action(`RATE_${i}`, async (ctx) => {
        const film = ctx.scene.state.film;
        if (!film) return ctx.answerCbQuery('⚠️ Не знайдено фільм у контексті.');

        await LibraryItem.updateOne(
            {user: ctx.from.id, film: film._id},
            {$set: {status: 'watched', rating: i}},
            {upsert: true},
        );

        await ctx.answerCbQuery();
        await ctx.editMessageReplyMarkup();
        await ctx.reply(
            `⭐ Оцінив <b>${film.title}</b> на ${i}/10. Гарний вибір!`,
            {parse_mode: 'HTML'},
        );
        await ctx.scene.leave();
    });
}

// === Кнопка "Назад" ===
addFilmScene.action('GO_BACK', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.reply('⬅ Повертаюсь назад...');
    await ctx.scene.enter('START_SCENE_ID');
});

// === Вихід зі сцени ===
addFilmScene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default addFilmScene;
