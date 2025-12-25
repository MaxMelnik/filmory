import escapeReservedCharacters from '../escapeReservedCharacters.js';
import makeMovieDeepLink from '../makeMovieDeepLink.js';

import { DAYS } from '../../config/dailyRecommendationThemes.js';

export async function createDailyRecommendation({
    day,
    title,
    originalTitle,
    year,
    genres,
    duration,
    description,
    filmId,
    postUrl,
}) {
    const caption = `${DAYS[day].emoji} ${DAYS[day].description}

*🎬 ${escapeReservedCharacters(title)}*${originalTitle ? ` / _${escapeReservedCharacters(originalTitle)}_` : ''} \\(${year}\\)
🎭 Жанр: ${genres.toString().toLowerCase().replaceAll(',', ', ').trim()}
⏱ Тривалість: ${duration}

━━ Чому варто глянути ━━

${escapeReservedCharacters(description)}

[💡 Збережи "${escapeReservedCharacters(title)}" в Filmory!](${makeMovieDeepLink(filmId)})

Хочеш персональну підбірку – пиши в *Filmory* 👇
@${escapeReservedCharacters(process.env.BOT_USERNAME) || ''}
`;

    const keyboard = [
        [{ text: `💡 Відкрити "${title}" в Filmory`, url: makeMovieDeepLink(filmId) }],
    ];

    return { caption, keyboard, postUrl };
}
