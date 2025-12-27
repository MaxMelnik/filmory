import dotenv from 'dotenv';
import bot from './bot/index.js';
import { startServer } from './server.js';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import cron from './cron/index.js';

dotenv.config();

(async () => {
    try {
        // Starting web-server
        await startServer();

        // Check mongo
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB не підключено, бот не може стартувати');
        }

        cron();

        // Launch bot
        const info = await bot.telegram.getMe();
        logger.info(`🤖 Filmory бот запущений як @${info.username}`);
        await bot.launch();

        // Graceful shutdown
        process.once('SIGINT', async () => {
            logger.info('🛑 Stopping Filmory...');
            await bot.stop('SIGINT');
            await mongoose.connection.close();
            process.exit(0);
        });

        process.once('SIGTERM', async () => {
            logger.info('🛑 Terminating Filmory...');
            await bot.stop('SIGTERM');
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (err) {
        logger.error('❌ Failed to launch Filmory:', err);
        process.exit(1);
    }
})();
