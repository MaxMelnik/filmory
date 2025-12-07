import os from 'os';
import mongoose from 'mongoose';
import getBotInstance from '../../bot/getBotInstance.js';
// import {GoogleGenAI} from '@google/genai';

// const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});

export class HealthService {
    static async getFullHealth() {
        const start = Date.now();
        const result = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || 'dev',
            environment: process.env.ENVIRONMENT || 'development',
            host: os.hostname(),
            metrics: {
                memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
                cpuLoad: os.loadavg()[0],
                uptimeMinutes: Math.round(process.uptime() / 60),
            },
            services: {},
        };

        // Mongo
        result.services.mongo =
            mongoose.connection.readyState === 1 ?
                { status: 'ok' } :
                { status: 'error', message: 'Mongo disconnected' };

        // Telegram
        try {
            const bot = getBotInstance();
            const me = await bot.telegram.getMe();
            result.services.telegram = { status: 'ok', username: me.username };
        } catch (err) {
            result.services.telegram = { status: 'error', message: err.message };
        }

        // Gemini
        // try {
        //     const resp = await ai.models.generateContent({
        //         model: 'gemma-3-27b-it',
        //         contents: 'ping',
        //     });
        //     const text = resp?.text?.trim()?.toLowerCase() || '';
        //     result.services.gemini = {
        //         status: text.includes('ping') || text ? 'ok' : 'degraded',
        //     };
        // } catch (err) {
        //     result.services.gemini = {status: 'error', message: err.message};
        // }

        result.latencyMs = Date.now() - start;

        return result;
    }

    static async getFastHealth() {
        const start = Date.now();
        const result = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || 'dev',
            environment: process.env.ENVIRONMENT || 'development',
            host: os.hostname(),
            metrics: {
                memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
                cpuLoad: os.loadavg()[0],
                uptimeMinutes: Math.round(process.uptime() / 60),
            },
        };

        result.latencyMs = Date.now() - start;

        return result;
    }
}
