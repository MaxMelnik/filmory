import mongoose from 'mongoose';
import pkg from 'mongoose-sequence';

const AutoIncrement = pkg(mongoose);

const filmSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        title: {
            type: String,
            required: true,
        },
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
            type: String,
        },
        description: {
            type: String,
        },
        posterUrl: {
            type: String,
        },
    },
    {timestamps: true},
);

filmSchema.plugin(AutoIncrement, {id: 'Film'});
export const Film = mongoose.model('Film', filmSchema);
