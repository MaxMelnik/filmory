import { Scenes, session } from 'telegraf';
import getBotInstance from './getBotInstance.js';

// === Scenes ===
import startScene from './scenes/startScene.js';
import addFilmScene from './scenes/addFilmScene.js';
import libraryScene from './scenes/libraryScene.js';
import recommendationScene from './scenes/recommendationScene.js';

// === Ініціалізація ===
const bot = getBotInstance();

// === Конфігурація сцен ===
const stage = new Scenes.Stage([
    startScene,
    addFilmScene,
    libraryScene,
    recommendationScene,
]);

bot.use(session());
bot.use(stage.middleware());

// === Обробка помилок ===
bot.catch(async (err, ctx) => {
    console.error('❌ Bot error:', err);

    if (err.name === 'TimeoutError') {
        console.warn('⏳ Telegram API call timed out. Skipping...');
        return;
    }

    try {
        const chatType = ctx.update.message?.chat?.type;
        const userId = ctx.update.message?.from?.id;

        if (chatType === 'private') {
            await ctx.reply('⚠️ Щось пішло не так. Перезапускаю сеанс…').catch((e) => {
                if (e.code === 403) {
                    console.warn(`🚫 Користувач ${userId} заблокував бота.`);
                } else {
                    console.error('Помилка при відповіді користувачу:', e);
                }
            });

            await ctx.scene.enter('START_SCENE_ID').catch((e) => {
                console.error('Не вдалося перейти до стартової сцени:', e);
            });
        }
    } catch (e) {
        console.error('Внутрішня помилка в catch:', e);
    }
});

// === Маршрути / entry points ===
// Коли користувач вводить /start → потрапляє в сцену
bot.start((ctx) => ctx.scene.enter('START_SCENE_ID'));

bot.command('add', (ctx) => ctx.scene.enter('ADD_FILM_SCENE_ID'));

bot.command('my_films', (ctx) => ctx.scene.enter('LIBRARY_SCENE_ID'));

bot.command('recommend', (ctx) => ctx.scene.enter('RECOMMENDATION_SCENE_ID'));

bot.action('ADD_FILM', (ctx) => ctx.scene.enter('ADD_FILM_SCENE_ID'));

bot.action('SHOW_LIST', (ctx) => ctx.scene.enter('LIBRARY_SCENE_ID'));

bot.action('GET_RECS', (ctx) => ctx.scene.enter('RECOMMENDATION_SCENE_ID'));

bot.action('FAKE_BUTTON', async (ctx) => {
    ctx.answerCbQuery();
});

// === Експорт інстансу ===
export default bot;
