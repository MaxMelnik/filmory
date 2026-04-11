import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import logger from '../../utils/logger.js';
import stripJsonFence from '../../utils/stripJsonFence.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import getTodayKey from '../../utils/getTodayKey.js';
import { DAYS } from '../../config/dailyRecommendationThemes.js';

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

// 🔧 Basic Models list by priority
export const DEFAULT_MODEL_PRIORITY = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    'gemma-3-4b-it',
    'gemma-3n-e4b-it',
    'gemma-3-2b-it',
    'gemma-3n-e2b-it',
    'gemma-3-1b-it',
];

/**
 * Is this our side error
 */
function isClientSideError(err) {

    if (!err?.code) return false;

    const numeric = Number(err.code);
    return [400, 401, 403, 404].includes(numeric);
}

/**
 * 🔹 Basic AI request with model fallback chain.
 *
 * @param {string} system - role or instruction (e.g. "Ти кінокритик Filmory")
 * @param {string} prompt - main request body
 * @param {string} model='gemma-3-27b-it' - primary Google AI model code
 * @param {string[]} [modelPriority=DEFAULT_MODEL_PRIORITY] - ordered list of models to try
 * @param {string} responseMimeType - response format (e.g. 'application/json')
 * @returns {Promise<string>}
 */
export async function askGemini({
    system,
    prompt,
    model,
    modelPriority = DEFAULT_MODEL_PRIORITY,
    responseMimeType,
} = {}) {
    const modelsToTry = model ? [
        model,
        ...modelPriority.filter((m) => m && m !== model),
    ] : modelPriority;

    let lastError;

    for (const currentModel of modelsToTry) {
        try {
            logger.info(`🧠 Calling AI model: ${currentModel}`);

            const request = {
                model: currentModel,
                system,
                contents: prompt,
            };

            if (responseMimeType) {
                request.generationConfig = {
                    response_mime_type: responseMimeType,
                };
            }

            const response = await ai.models.generateContent(request);
            const text = response.text?.trim();

            if (!text) {
                logger.info(response);
                throw new Error(`Empty response from model: ${currentModel}`);
            }

            // ✅ Успішна відповідь – віддаємо одразу
            return text;
        } catch (err) {
            lastError = err;
            logger.error(
                `❌ AI model failed: ${currentModel}. ${
                    isClientSideError(err)
                        ? 'Client-side error. '
                        : ''
                }Trying next model in fallback chain.`,
                err,
            );

            // if (isClientSideError(err)) break;
        }
    }

    logger.error('❌ All AI models failed in askGemini()', lastError);

    if (responseMimeType === 'application/json') {
        return '';
    }

    return '⚠️ Сервіс рекомендацій тимчасово недоступний. Спробуй, будь ласка, пізніше.';
}


/**
 * 🎬 Отримати рекомендації фільмів за назвою
 * @param {string} movieTitle
 * @returns {Promise<string>}
 */
export async function getFilmRecommendations(movieTitle) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';
    const prompt = `
Дай 5 фільмів, схожих на "${movieTitle}".
    
ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить саме цьому користувачу.",
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
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';

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
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить саме цьому користувачу.",
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
        responseMimeType: 'application/json',
    });

    try {
        const cleanText = stripJsonFence(responseText);
        const parsed = JSON.parse(cleanText);

        if (!parsed || !Array.isArray(parsed.films)) {
            throw new Error('Invalid JSON structure: "films" is missing or not an array');
        }

        return parsed.films;
    } catch (err) {
        logger.error('❌ Failed to parse Gemini JSON response:', err, { responseText });

        return [];
    }
}

/**
 * 🎬 Get recommendations by mood
 * @param {string} mood
 * @returns {Promise<string>}
 */
export async function getFilmRecommendationsByMood(mood) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';
    const prompt = `
Дай 5 фільмів, які відповідатимуть наступному настрою: "${mood}".
    
ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить саме під цей настрій.",
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
        responseMimeType: 'application/json',
    });

    // responseText тут має бути JSON-строка
    try {
        const cleanText = stripJsonFence(responseText);
        const parsed = JSON.parse(cleanText);

        if (!parsed || !Array.isArray(parsed.films)) {
            throw new Error('Invalid JSON structure: "films" is missing or not an array');
        }

        return parsed.films;
    } catch (err) {
        logger.error('❌ Failed to parse Gemini JSON response:', err, { responseText });

        return [];
    }
}

/**
 * 🎬 Get recommendations by company
 * @param {string} company
 * @returns {Promise<string>}
 */
export async function getFilmRecommendationsByCompany(company) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';
    const prompt = `
Дай 5 фільмів, які ідеально підійдуть для перегляду в наступній компанії: "${company}".
    
ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить саме для цієї компанії.",
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

        return [];
    }
}

/**
 * 🎬 Get recommendations by two users preferences
 * @returns {Promise<string>}
 */
export async function getCoopFilmRecommendations(userOneIncludeFilms, userOneExcludeFilms, userTwoIncludeFilms, userTwoExcludeFilms) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';

    const prompt = `
Першому користувачу сподобались фільми: ${userOneIncludeFilms || '—'}.
Першому користувачу не сподобались фільми: ${userOneExcludeFilms || '—'}.

Другому користувачу сподобались фільми: ${userTwoIncludeFilms || '—'}.
Другому користувачу не сподобались фільми: ${userTwoExcludeFilms || '—'}.

На основі цього підбери рівно 5 інших реальних фільмів, які з великою ймовірністю сподобаються обом користувачам.
Орієнтуйся не лише на жанри, але й на сюжетні тропи, режисерські прийоми та атмосферу.

ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить обом цим користувачам.",
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
        responseMimeType: 'application/json',
    });

    try {
        const cleanText = stripJsonFence(responseText);
        const parsed = JSON.parse(cleanText);

        if (!parsed || !Array.isArray(parsed.films)) {
            throw new Error('Invalid JSON structure: "films" is missing or not an array');
        }

        return parsed.films;
    } catch (err) {
        logger.error('❌ Failed to parse Gemini JSON response:', err, { responseText });

        return [];
    }
}

/**
 * 🎬 Get films by user description
 * @param {string} company
 * @returns {Promise<string>}
 */
export async function getFilmByUserDescription(company) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory. Тон спілкування - дружній, теплий, але експертний';
    const prompt = `
Користувач не пам'ятає назву фільму, але пам'ятає про нього наступне: "${company}". Дай існуючі фільми, які відповідають цьому опису.
    
ВІДПОВІДАЙ СТРОГО У ФОРМАТІ JSON, без \`\`\`json, без бектіків, без markdown, без будь-якого додаткового тексту до чи після JSON, без пояснень.
У текстових полях не використовуй символ \`"\`. Якщо потрібні лапки – використовуй українські « … » або одинарні ' … '.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить під цей опис.",
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

        return [];
    }
}

/**
 * 🎬 Get daily recommendation
 * @returns {Promise<string>}
 */
export async function getDailyRecommendation(excludeFilms) {
    const theme = DAYS[getTodayKey()].description;
    const excludedFilmsJson = JSON.stringify(excludeFilms, null, 2);
    logger.info(`excludedFilmsJson: ${excludedFilmsJson}`);
    const system = `
Ти — розумний кінокритик Filmory. Тон спілкування - дружній, теплий, але експертний.
Твоя задача — рекомендувати РІВНО ОДИН існуючий повнометражний фільм, який точно відповідає заданій темі.
Ти не маєш права рекомендувати серіали, мінісеріали, анімаційні серіали чи шоу.
Ти не маєш права рекомендувати фільми зі списку excluded films.

Перед тим як дати відповідь, виконай внутрішню перевірку:
1. Переконайся, що це саме фільм.
2. Переконайся, що фільм реальний і присутній у TMDB.
3. Переконайся, що його немає серед excluded films.
4. Порівнюй кандидата зі списком excluded films за таким пріоритетом:
   - tmdb_id
   - imdb_id
   - original_title + year
   - title + year
Якщо є збіг хоча б за одним правилом — відкинь цей варіант і вибери інший.

Поверни лише валідний JSON без пояснень поза JSON.
`;
    const prompt = `
Тема дня:
${theme}

EXCLUDED_FILMS_JSON:
${excludedFilmsJson}

Завдання:
Підбери рівно 1 фільм, який максимально добре підходить під тему дня.

Жорсткі правила:
- Радь лише full-length movie.
- Не радь серіали.
- Не вигадуй неіснуючих фільмів.
- Переконайся, що фільм є на TMDB.
- Не можна обирати жоден фільм із EXCLUDED_FILMS_JSON.
- Якщо кандидат збігається з будь-яким excluded film за tmdb_id, imdb_id, original_title+year або title+year — відкинь його і вибери інший.
- Віддавай перевагу різноманітності: не повторюй очевидні “найпопулярніші” варіанти, якщо є не менш влучний, але свіжіший або менш банальний вибір.

Формат відповіді:

{
  "films": [
    {
      "position": 1,
      "title": "Назва фільму (українська або міжнародна)",
      "original_title": "Оригінальна назва латинськими літерами",
      "year": 2010,
      "type": "movie",
      "tmdb_id": null,
      "imdb_id": null,
      "overview": "Короткий опис сюжету без спойлерів, одним реченням",
      "whyRecommended": "Коротко поясни, чому цей фільм підходить під цей опис.",
      "mood_tags": ["настрій1", "настрій2"],
      "content_warnings": []
    }
  ]
}

Важливо:
- Поверни рівно 1 фільм у масиві films.
- Якщо не впевнений у tmdb_id або imdb_id, постав null.
- Не додавай жодних полів поза схемою.
`;

    const responseText = await askGemini({
        system,
        prompt,
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

        return [];
    }
}

export async function pingGemini(model) {
    const system = '';
    const prompt = `PING`;

    return escapeReservedCharacters(await askGemini({
        system,
        prompt,
        model,
    }));
}

