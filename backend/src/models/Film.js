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

    },
    {timestamps: true, _id: false },
);

filmSchema.plugin(AutoIncrement, {id: 'Film'});
export const Film = mongoose.model('Film', filmSchema);
