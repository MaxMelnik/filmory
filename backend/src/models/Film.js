import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const filmSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        title: {
            type: String,
            required: true,
        },
        originalTitle: {
            type: String,
        },
        altTitles: [{
            type: String,
        }],
        year: {
            type: Number,
        },
        genres: [
            {
                type: String,
            },
        ],
        imdbId: {
            type: String,
        },
        tmdbId: {
            type: Number,
        },
        description: {
            type: String,
        },
        posterUrl: {
            type: String,
        },
        duration: {
            type: Number,
        },
    },
    { timestamps: true, _id: false },
);

filmSchema.plugin(AutoIncrement, { id: 'Film' });
export const Film = mongoose.model('Film', filmSchema);
