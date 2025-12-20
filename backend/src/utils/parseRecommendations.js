import { Markup } from 'telegraf';

export default function parseRecommendations(ctx, heading = null, recommendations = null) {
    if (!recommendations) recommendations = ctx.session.recommendations;
    ctx.session.recommendations = recommendations;

    if (!recommendations?.length) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]);

        return {
            finalText: 'Не вдалось отримати рекомендації. Спробуй, будь ласка, пізніше 😔',
            keyboard,
        };
    }

    if (!heading) heading = ctx.session.heading;
    ctx.session.heading = heading;
    if (!ctx.session.activeRecommendation) ctx.session.activeRecommendation = 1;
    const activeRecommendation = ctx.session.activeRecommendation;

    const pageButtons = [];

    let res = heading;

    let activeFilmCard = '';

    res += '\n';
    for (const rec of recommendations) {
        res += '\n';

        res += `*${rec.position === activeRecommendation ? '👉 ' : ''} ${rec.position}. ${rec.title}*`;
        if (rec.original_title && rec.original_title !== rec.title) {
            res += ` / _${rec.original_title}_`;
        }
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

            if (rec.why_recommended) {
                activeFilmCard += `\n\n_${rec.why_recommended.trim()}_`;
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
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ];

    const keyboard = Markup.inlineKeyboard([
        pageButtons,
        ...actionButtons,
    ]);

    return { finalText: res.trim(), keyboard };
}
