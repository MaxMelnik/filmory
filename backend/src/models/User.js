import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        telegramId: {
            type: Number,
            required: true,
            unique: true,
        },
        username: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        language: {
            type: String,
            default: 'uk',
        },
        firstSeenAt: {
            type: Date,
        },
        lastActiveAt: {
            type: Date,
        },
        aiRequestsTotal: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true, _id: false },
);

userSchema.plugin(AutoIncrement, { id: 'User' });
export const User = mongoose.model('User', userSchema);
