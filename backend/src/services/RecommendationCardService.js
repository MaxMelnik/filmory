import { RecommendationCard } from '../models/index.js';

/**
 * RecommendationCardService
 */
export default class RecommendationCardService {
    static async getByMessageId(messageId) {
        return RecommendationCard.findOne({ messageId });
    }

    static async saveRecommendationCard(
        messageId,
        recommendations,
        heading,
        promptType,
        promptData,
    ) {
        const data = {
            messageId,
            heading,
            promptType,
            promptData,
            films: recommendations,
        };

        let recommendationCard = await RecommendationCard.findOne({ messageId });
        if (!recommendationCard) {
            recommendationCard = new RecommendationCard(data);
        } else {
            Object.assign(recommendationCard, data);
        }

        return recommendationCard.save();
    }

}
