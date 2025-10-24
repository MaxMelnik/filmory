import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import bot from './bot/index.js';

dotenv.config();

const { MONGODB_CONNECT } = process.env;
if (!MONGODB_CONNECT) {
    console.error('❌ MONGO_URI відсутній у .env');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Health-check endpoint
app.get('/', (req, res) => res.send('🟢 Filmory bot is alive'));

// === 1. Запускаємо веб-сервер спочатку ===
app.listen(PORT, async () => {
    console.log(`🌐 Web server is running on port ${PORT}`);

    // === 2. Після цього підключаємось до Mongo ===
    try {
        await mongoose.connect(MONGODB_CONNECT);
        console.log('✅ Підключено до MongoDB');
    } catch (err) {
        console.error('❌ Помилка підключення MongoDB:', err);
        process.exit(1);
    }

    // === 3. Тепер запускаємо бота ===
    try {
        await bot.telegram.getMe().then(info => {
            console.log(`🤖 Filmory запущений як @${info.username}`);
        });
        bot.launch();
    } catch (err) {
        console.error('❌ Не вдалося отримати інформацію про бота:', err);
    }


});

// === 4. Graceful shutdown ===
process.once('SIGINT', async () => {
    console.log('🛑 Зупиняю Filmory...');
    await bot.stop('SIGINT');
    await mongoose.connection.close();
    process.exit(0);
});

process.once('SIGTERM', async () => {
    console.log('🛑 Зупиняю Filmory...');
    await bot.stop('SIGTERM');
    await mongoose.connection.close();
    process.exit(0);
});
