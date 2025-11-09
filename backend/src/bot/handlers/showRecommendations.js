import { showWaiter } from '../../utils/animatedWaiter.js';
import { getListOfFilmsRecommendations } from '../../services/integrations/geminiService.js';
import { LibraryService } from '../../services/LibraryService.js';
import { UserService } from '../../services/UserService.js';

export async function showRecommendations(ctx) {
    const user = await UserService.getByTelegramId(ctx.from.id);
    const favouriteMovies = await LibraryService.getUserFavouriteFilms(user._id, 8);
    const includeFilms = favouriteMovies
        .map(movie => movie.title)
        .filter(Boolean)
        .map(title => `"${title}"`)
        .join(', ');

    console.log(includeFilms);

    await showWaiter(ctx, {
        message: `Шукаю фільми на основі твоїх вподобань`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getListOfFilmsRecommendations(includeFilms),
        onDone: (response) => `🎬 Я знайшов для тебе фільми, які сподобаються:\n\n${response}`,
    });
}
