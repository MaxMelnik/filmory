import express from 'express';
import mongoose from 'mongoose';
import systemRoutes from './server/routes/systemRoutes.js';

export async function startServer() {
    const app = express();

    // Basic Health-check
    app.get('/', (req, res) => res.send('🟢 Filmory API is alive'));

    // Routes
    app.use(systemRoutes);

    // Mongo connect
    const { MONGODB_CONNECT } = process.env;
    if (!MONGODB_CONNECT) throw new Error('❌ MONGO_URI відсутній у .env');

    await mongoose.connect(MONGODB_CONNECT);
    console.log('✅ MongoDB connected');

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🌐 Filmory server listening on port ${PORT}`);
    });

    return app;
}
