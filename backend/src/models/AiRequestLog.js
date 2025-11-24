import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const aiRequestLogSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        telegramId: {
            type: Number,
            index: true,
        },
        plan: {
            type: String,
            enum: ['FREE', 'PLUS', 'ROOT'],
            index: true,
        },
    },
    { timestamps: true, _id: false },
);

aiRequestLogSchema.plugin(AutoIncrement, { id: 'AiRequestLog' });
export const AiRequestLog = mongoose.model('AiRequestLog', aiRequestLogSchema);
