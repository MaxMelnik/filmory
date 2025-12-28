import cron from 'node-cron';
import getBotInstance from '../bot/getBotInstance.js';
import cronPing from './cronPing.js';
import logger from '../utils/logger.js';
import postDailyRecommendation from './postDailyRecommendation.js';

export default function() {
    logger.info(`Starting cron on ${process.env.ENVIRONMENT}`);
    const bot = getBotInstance();

    const pingCronRule = (process.env.ENVIRONMENT === 'DEV') ? '* * * * *' : '0 17 * * *';
    logger.info(`pingCronRule: ${pingCronRule}`);
    cron.schedule(pingCronRule, async () => {
        await cronPing(bot);
        logger.info(`Done. Cron PING: ${new Date().toString().substring(0, 25)}`);
    });

    if (process.env.ENVIRONMENT === 'PROD') {
        const postDailyRecommendationCronRule  = (process.env.ENVIRONMENT === 'DEV') ? '* * * * *' : '20 17 * * *';
        logger.info(`postDailyRecommendationCronRule: ${postDailyRecommendationCronRule}`);
        cron.schedule(postDailyRecommendationCronRule, async () => {
            await postDailyRecommendation(bot);
            logger.info(`Done. Cron post Daily Recommendation: ${new Date().toString().substring(0, 25)}`);
        });
    }

    logger.info(`🕑 Cron is scheduled`);
};
