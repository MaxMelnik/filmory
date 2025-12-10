export function handleCommandsOnText(ctx, input) {
    if (input === '/root') {
        ctx.scene.enter('ROOT_SCENE_ID');
        return true;
    }
    if (input === '/start') {
        ctx.scene.enter('START_SCENE_ID');
        return true;
    }
    if (input === '/add') {
        ctx.scene.enter('ADD_FILM_SCENE_ID');
        return true;
    }
    if (input === '/my_films') {
        ctx.scene.enter('LIBRARY_SCENE_ID');
        return true;
    }
    if (input === '/recommend') {
        ctx.scene.enter('RECOMMENDATION_SCENE_ID');
        return true;
    }
    if (input === '/plus') {
        ctx.scene.enter('SUBSCRIPTIONS_SCENE_ID');
        return true;
    }
    return false;
}
