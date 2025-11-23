import { Scenes } from 'telegraf';
import { showSubscriptions } from '../handlers/showSubscriptions.js';

const scene = new Scenes.BaseScene('SUBSCRIPTIONS_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    await showSubscriptions(ctx);
});

export default scene;
