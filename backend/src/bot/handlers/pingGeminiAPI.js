import { showWaiter } from '../../utils/animatedWaiter.js';
import { pingGemini } from '../../services/integrations/geminiService.js';
import logger from '../../utils/logger.js';

export async function pingGeminiAPI(ctx) {
    logger.info(`[PING GEMINI] @${ctx.from.username || ctx.from.id}`);

    await showWaiter(ctx, {
        message: `Шукаю фільми на основі твоїх вподобань`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await pingGemini('gemini-robotics-er-1.5-preview'),
        // onDone: (response) => response,
    });
}
