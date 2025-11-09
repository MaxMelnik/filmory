import { Scenes } from 'telegraf';
import { handleStart } from '../handlers/start.js';
import { message } from 'telegraf/filters';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getFilmRecommendations } from '../../services/integrations/geminiService.js';

const scene = new Scenes.BaseScene('START_SCENE_ID');

scene.enter(async (ctx) => handleStart(ctx));

scene.on(message('text'), async (ctx) => {
    console.log(`Start Scene text: ${ctx.message.text}`);
    if (ctx.message.text === '/start') return ctx.scene.enter('START_SCENE_ID');
    if (ctx.message.text === '/add') return ctx.scene.enter('ADD_FILM_SCENE_ID');
    if (ctx.message.text === '/my_films') return ctx.scene.enter('LIBRARY_SCENE_ID');
    if (ctx.message.text === '/recommendation') return ctx.scene.enter('RECOMMENDATION_SCENE_ID');
    const movieName = ctx.message.text;
    await showWaiter(ctx, {
        message: `Шукаю фільми схожі на "${movieName}"`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getFilmRecommendations(movieName),
        onDone: (response) => `🎬 Фільми схожі на "${movieName}":\n\n${response}`,
    });
});

export default scene;
