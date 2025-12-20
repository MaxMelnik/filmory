import cron from 'node-cron';
import getBotInstance from '../bot/getBotInstance.js';
import cronPing from './cronPing.js';
import logger from '../utils/logger.js';


export default function() {
    logger.info(`Starting cron on ${process.env.ENVIRONMENT}`);
    const bot = getBotInstance();
    const pingCronRule = (process.env.ENVIRONMENT === 'DEV') ? '* * * * *' : '0 17 * * *';
    logger.info(`pingCronRule: ${pingCronRule}`);
    cron.schedule(pingCronRule, async () => {
        await cronPing(bot);
        logger.info(`Done. cron PING: ${new Date().toString().substring(0, 25)}`);
    });
    logger.info(`🕑 Cron is scheduled`);
};
