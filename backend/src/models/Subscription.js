import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const subscriptionSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        telegramId: {
            type: Number,
            required: true,
            index: true,
        },
        plan: {
            type: String,
            enum: ['FREE', 'PLUS', 'ROOT'],
            default: 'FREE',
        },
        expiresAt: {
            type: Date,
        },
        lastPaymentAt: {
            type: Date,
        },
        lastPaymentStars: {
            type: Number,
        },
        isRecurring: {
            type: Boolean,
            default: true,
        },
        isFirstRecurring: {
            type: Boolean,
            default: false,
        },
        telegramPaymentChargeId: {
            type: String,
        },
        providerPaymentChargeId: {
            type: String,
        },
        isCanceled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true, _id: false },
);

subscriptionSchema.index({ telegramId: 1, plan: 1 }, { unique: true });
subscriptionSchema.plugin(AutoIncrement, { id: 'Subscription' });
export const Subscription = mongoose.model('Subscription', subscriptionSchema);
