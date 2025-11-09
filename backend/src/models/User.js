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
        favoriteGenres: [String],
    },
    { timestamps: true, _id: false },
);

userSchema.plugin(AutoIncrement, { id: 'User' });
export const User = mongoose.model('User', userSchema);
