import { Film } from '../../models/index.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getFilmRecommendations } from '../../services/integrations/geminiService.js';
import { isRequestAllowed } from '../../services/system/QuotaService.js';
import { Markup } from 'telegraf';

export async function recommendSimilar(ctx) {
    await ctx.answerCbQuery();

    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    if (!await isRequestAllowed(ctx, [], getPlusKeyboard)) return;

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
}
