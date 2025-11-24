import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const usageSchema = new mongoose.Schema(
    {
        telegramId: {
            type: Number,
            required: true,
            unique: true,
            index: true,
        },
        dayKey: {
            type: String,
            required: true,
        },
        requestsToday: {
            type: Number,
            default: 0,
        },
        lastRequestAt: {
            type: Date,
        },
    },
    { timestamps: true, _id: false },
);

usageSchema.plugin(AutoIncrement, { id: 'Usage' });
export const Usage = mongoose.model('Usage', usageSchema);
