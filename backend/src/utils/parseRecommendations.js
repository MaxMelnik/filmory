import { Markup } from 'telegraf';

export default function parseRecommendations(ctx, heading = null, recommendations = null) {
    if (!recommendations) recommendations = ctx.session.recommendations;
    ctx.session.recommendations = recommendations;
    if (!heading) heading = ctx.session.heading;
    ctx.session.heading = heading;
    if (!ctx.session.activeRecommendation) ctx.session.activeRecommendation = 1;
    const activeRecommendation = ctx.session.activeRecommendation;

    if (recommendations.length === 0) return 'Не вдалось отримати рекомендації. Спробуй, будь ласка, ще раз 😔';

    const pageButtons = [];

    let res = heading;

    for (const rec of recommendations) {
        res += '\n\n';

        res += `*${rec.position}. ${rec.title}*`;
        if (rec.original_title && rec.original_title !== rec.title) {
            res += ` / _${rec.original_title}_`;
        }
        if (rec.year) {
            res += ` (${rec.year})`;
        }

        if (rec.position === activeRecommendation) {
            if (rec.mood_tags?.length) {
                res += `\n`;
                for (const tag of rec.mood_tags) {
                    res += `\\[\`${tag}\`] `;
                }
            }

            if (rec.overview) {
                res += `\n${rec.overview.trim()}`;
            }

            if (rec.why_recommended) {
                res += `\n\n_${rec.why_recommended.trim()}_`;
            }
        }

        pageButtons.push(Markup.button.callback(
            `${rec.position} ${(rec.position === activeRecommendation) ? '🔍' : ''}`,
            `SELECT_ACTIVE_REC_${rec.position}`));
    }

    const actionButtons = [
        [Markup.button.callback(`💾 Зберегти '${recommendations[activeRecommendation - 1].title}'`, `SAVE_ACTIVE_REC_${activeRecommendation}`)],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ];

    const keyboard = Markup.inlineKeyboard([
        pageButtons,
        ...actionButtons,
    ]);

    return { finalText: res.trim(), keyboard };
}
