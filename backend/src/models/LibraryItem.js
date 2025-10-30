import mongoose from 'mongoose';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const libraryItemSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        userId: {
            type: Number,
            ref: () => 'User',
            required: true,
        },
        filmId: {
            type: Number,
            ref: () => 'Film',
            required: true,
        },
        status: {
            type: String,
            enum: ['watched', 'watch_later'],
            required: true,
            default: 'watch_later',
        },
        rating: {type: Number, min: 0, max: 10},
        comment: {type: String, trim: true},
        addedAt: {type: Date, default: Date.now},
    },
    {timestamps: true, _id: false},
);

libraryItemSchema.index({user: 1, film: 1}, {unique: true});
libraryItemSchema.plugin(AutoIncrement, {id: 'LibraryItem'});


export const LibraryItem = mongoose.model('LibraryItem', libraryItemSchema);
