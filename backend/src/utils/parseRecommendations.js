export default function parseRecommendations(recommendations, heading) {
    if (recommendations.length === 0) return 'Не вдалось отримати рекомендації. Спробуй, будь ласка, ще раз 😔'

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

    return res.trim();
}
