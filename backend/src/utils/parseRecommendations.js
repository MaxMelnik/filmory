import { Markup } from 'telegraf';
import RecommendationCardService from '../services/RecommendationCardService.js';

export default async function parseRecommendations(ctx, heading = null, recommendations = null) {
    const messageId = ctx.session.messageId ?? ctx.callbackQuery?.message?.message_id;
    const chatId = ctx.callbackQuery?.message?.chat.id ?? ctx.from?.id;
    ctx.session.messageId = null;
    let recommendationsCard;
    if (!recommendations) recommendationsCard = await RecommendationCardService.getByMessageId(messageId, chatId);
    recommendationsCard ??= await RecommendationCardService.saveRecommendationCard(
        messageId,
        chatId,
        recommendations,
        heading,
        ctx.session.promptType,
        ctx.session.promptData,
    );
    ctx.session.promptType = null;
    ctx.session.promptData = null;

    recommendations = recommendationsCard.films;
    ctx.session.recommendations = recommendations;

    if (!recommendations?.length) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME')],
        ]);

        return {
            finalText: 'Не вдалось отримати рекомендації. Спробуй, будь ласка, пізніше 😔',
            keyboard,
        };
    }

    heading ??= recommendationsCard.heading;
    if (!ctx.session.activeRecommendation) ctx.session.activeRecommendation = 1;
    const activeRecommendation = ctx.session.activeRecommendation;

    const pageButtons = [];

    let res = heading;

    let activeFilmCard = '';

    res += '\n';
    for (const rec of recommendations) {
        res += '\n';

        res += `*${rec.position === activeRecommendation ? '👉 ' : ''} ${rec.position}. ${rec.title}*`;
        // if (rec.original_title && rec.original_title !== rec.title) {
        //     res += ` / _${rec.original_title}_`;
        // }
        if (rec.year) {
            res += ` (${rec.year})`;
        }

        if (rec.position === activeRecommendation) {
            activeFilmCard += `\n\n\`━━━━━ Картка фільму №${rec.position} ━━━━━\`\n\n`;

            activeFilmCard += `*🎞 ${rec.title}*`;
            if (rec.original_title && rec.original_title !== rec.title) {
                activeFilmCard += ` / _${rec.original_title}_`;
            }
            if (rec.year) {
                activeFilmCard += ` (${rec.year})`;
            }
            activeFilmCard += '\n';

            if (rec.mood_tags?.length) {
                for (const tag of rec.mood_tags) {
                    activeFilmCard += `\\[\`${tag}\`] `;
                }
                activeFilmCard += '\n';
            }

            if (rec.overview) {
                activeFilmCard += `\n${rec.overview.trim()}`;
            }

            if (rec.whyRecommended) {
                activeFilmCard += `\n\n_${rec.whyRecommended.trim()}_`;
            }
        }

        pageButtons.push(Markup.button.callback(
            `${rec.position} ${(rec.position === activeRecommendation) ? '🔍' : ''}`,
            `SELECT_ACTIVE_REC_${rec.position}`));
    }

    res += activeFilmCard;

    const actionButtons = [
        [Markup.button.callback(
            `💾 Зберегти "${recommendations[activeRecommendation - 1].title}"`,
            `SAVE_ACTIVE_REC_${activeRecommendation - 1}`,
        )],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME')],
    ];

    const keyboard = Markup.inlineKeyboard([
        pageButtons,
        ...actionButtons,
    ]);

    return { finalText: res.trim(), keyboard };
}
