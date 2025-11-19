import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const { GEMINI_API_KEY } = process.env;

if (!GEMINI_API_KEY) {
    console.error('❌ GOOGLE_API_KEY не знайдено у .env');
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
 * @returns {Promise<string>}
 */
export async function askGemini({ system, prompt, model = 'gemini-2.0-flash' }) {
    try {
        const response = await ai.models.generateContent({
            model,
            system,
            contents: prompt,
        });

        return response.text?.trim() || '⚠️ Порожня відповідь від моделі';
    } catch (err) {
        console.error('❌ Gemini API error:', err);
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
    const prompt =
        `Дай 5 фільмів, схожих на "${movieTitle}". Не повторюй текст запиту, не додавай Markdown. ` +
        `Формат - простий нумерований список: Назва фільму | короткий опис одним реченням.`;

    const responseText = await askGemini({ system, prompt });

    // форматування для зручності у Telegram
    return responseText
        .replaceAll('|', '\n')
        .replaceAll('.\n', '.\n\n')
        .trim();
}

/**
 * 🎬 Отримати рекомендації фільмів за списком фільмів
 * @param {string} includeFilms
 * @param {string} excludeFilms
 * @returns {Promise<string>}
 */
export async function getListOfFilmsRecommendations(includeFilms, excludeFilms) {
    const system = 'Ти — розумний кінокритик, який радить фільми користувачам Filmory.';
    const prompt =
        `Користувачу сподобались фільми ${includeFilms}. ` +
        `Користувачу не сподобались фільми ${excludeFilms}. ` +
        `Дай 5 інших фільмів, які точно сподобаються користувачу. Орієнтуйся не лише на жанри, але й на сюжетні тропи, режисерські прийоми та атмосферу. ` +
        `Не повторюй текст запиту, не додавай Markdown, не додавай жодної додаткової інформації чи коментарів. ` +
        `Формат - простий нумерований список: Назва фільму | короткий опис одним реченням.`;

    const responseText = await askGemini({ system, prompt });

    // форматування для зручності у Telegram
    return responseText
        .replaceAll('|', '\n')
        .replaceAll('.\n', '.\n\n')
        .trim();
}
