import dotenv from 'dotenv';
import bot from './bot/index.js';
import { startServer } from './server.js';
import mongoose from 'mongoose';
import logger from './utils/logger.js';

dotenv.config();

(async () => {
    try {
        // 1️⃣ Запускаємо веб-сервер
        await startServer();

        // 2️⃣ Перевіряємо Mongo перед запуском бота
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB не підключено, бот не може стартувати');
        }

        // 3️⃣ Запускаємо бота
        const info = await bot.telegram.getMe();
        logger.info(`🤖 Filmory бот запущений як @${info.username}`);
        await bot.launch();

        // 4️⃣ Graceful shutdown
        process.once('SIGINT', async () => {
            logger.info('🛑 Зупиняю Filmory...');
            await bot.stop('SIGINT');
            await mongoose.connection.close();
            process.exit(0);
        });

        process.once('SIGTERM', async () => {
            logger.info('🛑 Зупиняю Filmory...');
            await bot.stop('SIGTERM');
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (err) {
        console.error('❌ Помилка запуску Filmory:', err);
        process.exit(1);
    }
})();
