import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const dailyRecommendationSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        filmId: {
            type: String,
            ref: 'Film',
        },
        days: [
            {
                type: String,
            },
        ],
    },
    { timestamps: true, _id: false },
);

dailyRecommendationSchema.plugin(AutoIncrement, { id: 'DailyRecommendation' });
export const DailyRecommendation = mongoose.model('DailyRecommendation', dailyRecommendationSchema);
