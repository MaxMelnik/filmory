import { Scenes } from 'telegraf';
import { showRecommendations } from '../handlers/showRecommendations.js';

const scene = new Scenes.BaseScene('RECOMMENDATION_SCENE_ID');

// === Вхід у сцену ===
scene.enter(async (ctx) => {
    await showRecommendations(ctx);
});

scene.action('GO_BACK', (ctx) => ctx.scene.enter('START_SCENE_ID'));

export default scene;
