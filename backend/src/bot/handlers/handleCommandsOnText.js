import logger from '../../utils/logger.js';
import { UserService } from '../../services/UserService.js';

export async function handleCommandsOnText(ctx, input) {
    logger.info(`Input from @${ctx.from.username || ctx.from.id}: ${input}`);

    if (input.startsWith('/start movie_')) {
        const user = await UserService.getOrCreateUserFromCtx(ctx);
        logger.info(`Start with payload by @${user.username || user.telegramId}: ${input.slice('/start '.length)}`);

        ctx.session.filmId = input.slice('/start movie_'.length);
        await ctx.scene.enter('ADD_FILM_SCENE_ID');
        return true;
    }

    if (input === '/root' && await UserService.isRoot(ctx.from.id)) {
        await ctx.scene.enter('ROOT_SCENE_ID');
        return true;
    }
    if (input === '/start') {
        await ctx.scene.enter('START_SCENE_ID');
        return true;
    }
    if (input === '/add') {
        await ctx.scene.enter('ADD_FILM_SCENE_ID');
        return true;
    }
    if (input === '/my_films') {
        await ctx.scene.enter('LIBRARY_SCENE_ID');
        return true;
    }
    if (input === '/recommend') {
        await ctx.scene.enter('RECOMMENDATION_SCENE_ID');
        return true;
    }
    if (input === '/plus') {
        await ctx.scene.enter('SUBSCRIPTIONS_SCENE_ID');
        return true;
    }
    return false;
}
