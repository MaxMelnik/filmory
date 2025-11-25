import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import logger from '../../utils/logger.js';
import stripJsonFence from '../../utils/stripJsonFence.js';

dotenv.config();

const { GEMINI_API_KEY } = process.env;

if (!GEMINI_API_KEY) {
    logger.error('❌ GOOGLE_API_KEY не знайдено у .env');
    process.exit(1);
}

// Ініціалізація нового клієнта
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

/**
 * 🔹 Базовий генератор тексту з system + user контекстом
 * @param {string} system - роль або інструкція (напр. "Ти кінокритик Filmory")
 * @param {string} prompt - запит користувача
 * @param {string} model - модель Gemini (за замовчуванням gemini-2.0-flash)
 * @param {string} responseMimeType - формат відповіді моделі (наприклад 'application/json')
 * @returns {Promise<string>}
 */
export async function askGemini({
    system,
    prompt,
    model = 'gemini-2.0-flash',
    responseMimeType,
} = {}) {
    try {
        const request = {
            model,
            // якщо твій SDK реально підтримує це поле — ок,
            // в офіційному клієнті воно називається systemInstruction
            system,
            contents: prompt,
        };

        if (responseMimeType) {
            request.generationConfig = {
                response_mime_type: responseMimeType,
            };
        }

        const response = await ai.models.generateContent(request);

        return response.text?.trim() || '';
    } catch (err) {
        logger.error('❌ Gemini API error:', err);

        if (responseMimeType === 'application/json') {
            return '';
        }

        return '⚠️ Сервіс Gemini тимчасово недоступний. Спробуй, будь ласка, пізніше';
    }
}


/**
 * 🎬 Отримати рекомендації фільмів за назвою
 * @param {string} movieTitle
 * @returns {Promise<string>}
 */
export async function getFilmRecommendations(movieTitle) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory.';
    const prompt = `
Дай 5 фільмів, схожих на "${movieTitle}".
    
ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (локалізована або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "why_recommended": "Коротко поясни, чому цей фільм підходить саме цьому користувачу.",
      "mood_tags": ["настрій1", "настрій2"],
      "content_warnings": ["якщо є важливі попередження, інакше порожній масив []"]
    }
  ]
}

Важливо:
- Поверни рівно 5 фільмів у масиві films.
- Якщо ти не впевнений у tmdb_id або imdb_id, постав null.
- Не додавай жодних полів, яких немає в цьому форматі.
`;

    const responseText = await askGemini({
        system,
        prompt,
        model: 'gemini-2.0-flash',
        responseMimeType: 'application/json',
    });

    // responseText тут має бути JSON-строка
    try {
        const cleanText = stripJsonFence(responseText);
        const parsed = JSON.parse(cleanText);

        if (!parsed || !Array.isArray(parsed.films)) {
            throw new Error('Invalid JSON structure: "films" is missing or not an array');
        }

        // Тут уже масив об’єктів: [{ title, year, overview, ... }, ...]
        return parsed.films;
    } catch (err) {
        logger.error('❌ Failed to parse Gemini JSON response:', err, { responseText });

        // Фолбек — щоб бот не падав
        return [];
    }
}

/**
 * 🎬 Отримати рекомендації фільмів за списком фільмів
 * @param {string} includeFilms
 * @param {string} excludeFilms
 * @returns {Promise<string>}
 */
export async function getListOfFilmsRecommendations(includeFilms, excludeFilms) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory.';

    const prompt = `
Користувачу сподобались фільми: ${includeFilms || '—'}.
Користувачу не сподобались фільми: ${excludeFilms || '—'}.

На основі цього підбери рівно 5 інших реальних фільмів, які з великою ймовірністю сподобаються користувачу.
Орієнтуйся не лише на жанри, але й на сюжетні тропи, режисерські прийоми та атмосферу.

ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (локалізована або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "why_recommended": "Коротко поясни, чому цей фільм підходить саме цьому користувачу.",
      "mood_tags": ["настрій1", "настрій2"],
      "content_warnings": ["якщо є важливі попередження, інакше порожній масив []"]
    }
  ]
}

Важливо:
- Поверни рівно 5 фільмів у масиві films.
- Якщо ти не впевнений у tmdb_id або imdb_id, постав null.
- Не додавай жодних полів, яких немає в цьому форматі.
`;

    const responseText = await askGemini({
        system,
        prompt,
        model: 'gemini-2.0-flash',
        responseMimeType: 'application/json',
    });

    // responseText тут має бути JSON-строка
    try {
        const cleanText = stripJsonFence(responseText);
        const parsed = JSON.parse(cleanText);

        if (!parsed || !Array.isArray(parsed.films)) {
            throw new Error('Invalid JSON structure: "films" is missing or not an array');
        }

        // Тут уже масив об’єктів: [{ title, year, overview, ... }, ...]
        return parsed.films;
    } catch (err) {
        logger.error('❌ Failed to parse Gemini JSON response:', err, { responseText });

        // Фолбек — щоб бот не падав
        return [];
    }
}

