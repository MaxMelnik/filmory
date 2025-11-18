import { Scenes } from 'telegraf';
import { handleStart } from '../handlers/start.js';

const scene = new Scenes.BaseScene('START_SCENE_ID');

scene.enter(async (ctx) => handleStart(ctx));

export default scene;
