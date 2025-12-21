import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { handleAddFilm, handleFilmDescriptionInput, handleFilmTitleInput, searchNewFilmByUserDescription } from '../handlers/addFilm.js';
import { handleCommandsOnText } from '../handlers/handleCommandsOnText.js';
import filmCardControls from '../handlers/filmCardControls.js';

const scene = new Scenes.BaseScene('ADD_FILM_SCENE_ID');

// Enter addFilm Scene
scene.enter(async (ctx) => {
    await handleAddFilm(ctx);
});

scene.on(message('text'), async (ctx) => {
    if (await handleCommandsOnText(ctx, ctx.message?.text?.trim())) return;
    const inputType = ctx.scene?.state?.inputType;
    if (inputType === 'title') return await handleFilmTitleInput(ctx);
    if (inputType === 'description') return await handleFilmDescriptionInput(ctx);
});

scene.action('SEARCH_NEW_BY_DESCRIPTION', async (ctx) => await searchNewFilmByUserDescription(ctx));

filmCardControls(scene);

// === Вихід зі сцени ===
scene.leave(async (ctx) => {
    if (ctx.session) ctx.session.awaitingFilmTitle = false;
});

export default scene;
