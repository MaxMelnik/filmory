import { RecommendationCard } from '../models/index.js';

/**
 * RecommendationCardService
 */
export default class RecommendationCardService {
    static async getByMessageId(messageId, chatId) {
        return RecommendationCard.findOne({ messageId, chatId });
    }

    static async saveRecommendationCard(
        messageId,
        chatId,
        recommendations,
        heading,
        promptType,
        promptData,
    ) {
        const data = {
            messageId,
            chatId,
            heading,
            promptType,
            promptData,
            films: recommendations,
        };

        let recommendationCard = await RecommendationCard.findOne({ messageId, chatId });
        if (!recommendationCard) {
            recommendationCard = new RecommendationCard(data);
        } else {
            Object.assign(recommendationCard, data);
        }

        return recommendationCard.save();
    }

}
