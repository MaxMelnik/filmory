import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bot from './bot/index.js'; // головна логіка бота

dotenv.config();

const { MONGODB_CONNECT } = process.env;

// === 1. Перевірка змінних ===
if (!MONGODB_CONNECT) {
    console.error('❌ MONGO_URI відсутній у .env');
    process.exit(1);
}

// === 2. Підключення до Mongo ===
mongoose.connect(MONGODB_CONNECT)
    .then(() => console.log('✅ Підключено до MongoDB'))
    .catch((err) => {
        console.error('❌ Помилка підключення MongoDB:', err);
        process.exit(1);
    });

// === 3. Запуск бота ===
try {
    await bot.launch();
    console.log('🤖 Filmory bot запущений успішно!');
} catch (err) {
    console.error('❌ Не вдалося запустити бота:', err);
    process.exit(1);
}

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
