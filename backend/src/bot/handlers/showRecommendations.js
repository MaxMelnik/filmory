import { showWaiter } from '../../utils/animatedWaiter.js';
import { getListOfFilmsRecommendations } from '../../services/integrations/geminiService.js';
import { LibraryService } from '../../services/LibraryService.js';
import { UserService } from '../../services/UserService.js';
import { isRequestAllowed } from '../../services/system/QuotaService.js';

export async function showRecommendations(ctx) {
    console.log(`[RECOMMENDATIONS SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);

    if (!await isRequestAllowed(ctx)) return;

    let user = await UserService.getOrCreateUserFromCtx(ctx);

    const favouriteMovies = await LibraryService.getUserFavouriteFilms(user._id, 8);
    const worstMovies = await LibraryService.getUserWorstFilms(user._id, 4);
    const includeFilms = favouriteMovies
        .map(movie => movie.title)
        .filter(Boolean)
        .map(title => `"${title}"`)
        .join(', ');

    const excludeFilms = worstMovies
        .map(movie => movie.title)
        .filter(Boolean)
        .map(title => `"${title}"`)
        .join(', ');

    console.log({ includeFilms });
    console.log({ excludeFilms });

    await showWaiter(ctx, {
        message: `Шукаю фільми на основі твоїх вподобань`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getListOfFilmsRecommendations(includeFilms, excludeFilms),
        onDone: (response) => `🎬 Я знайшов для тебе фільми, які сподобаються:\n\n${response}`,
    });
}
