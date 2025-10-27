import {Scenes} from 'telegraf';
import {handleStart} from '../handlers/start.js';
import {message} from 'telegraf/filters';
import {GoogleGenAI} from '@google/genai';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

const scene = new Scenes.BaseScene('START_SCENE_ID');

scene.enter(async (ctx) => handleStart(ctx));

scene.on(message('text'), async (ctx) => {
    console.log(`Start Scene text: ${ctx.message.text}`);
    if (ctx.message.text === '/start') return ctx.scene.enter('START_SCENE_ID');
    const sourceFilmTitle = ctx.message.text;
    ctx.reply(`Шукаю фільми схожі на "${sourceFilmTitle}"...`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Дай 5 варіантів фільмів схожих на ${sourceFilmTitle}. Не повторюй текст запиту і не додавай форматування.` +
            `Відповідь - простий нумерований список: Назва фільму | короткий опис одним реченням`,
    });
    console.log('-------------------------------------------------------------------------------');
    console.log(response.text);
    const responseMessage = response.text
        .replaceAll('|', '\n')
        .replaceAll('.\n', '.\n\n');
    ctx.reply(responseMessage);
});

export default scene;
