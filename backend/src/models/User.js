import mongoose from 'mongoose';
import pkg from 'mongoose-sequence';

const AutoIncrement = pkg(mongoose);

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
        watchedFilms: [
            {
                filmId: {type: Number, ref: 'Film'},
                addedAt: {type: Date, default: Date.now},
            },
        ],
        watchLater: [
            {
                filmId: {type: Number, ref: 'Film'},
                addedAt: {type: Date, default: Date.now},
            },
        ],
    },
    {timestamps: true},
);

userSchema.plugin(AutoIncrement, {id: 'User'});
export const User = mongoose.model('User', userSchema);
