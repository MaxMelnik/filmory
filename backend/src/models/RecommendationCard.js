import mongoose from 'mongoose';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const AutoIncrement = require('mongoose-sequence')(mongoose);

const recommendationCardSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        messageId: {
            type: Number,
        },
        heading: {
            type: String,
        },
        promptType: {
            type: String,
        },
        promptData: {
            type: String,
        },
        films: [
            {
                position: {
                    type: Number,
                },
                title: {
                    type: String,
                },
                original_title: {
                    type: String,
                },
                year: {
                    type: Number,
                },
                overview: {
                    type: String,
                },
                whyRecommended: {
                    type: String,
                },
                type: {
                    type: String,
                },
                tmdb_id: {
                    type: String,
                },
                imdb_id: {
                    type: String,
                },
                mood_tags: [
                    {
                        type: String,
                    },
                ],
                content_warnings: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },
    { timestamps: true, _id: false },
);

recommendationCardSchema.plugin(AutoIncrement, { id: 'RecommendationCard' });
export const RecommendationCard = mongoose.model('RecommendationCard', recommendationCardSchema);
