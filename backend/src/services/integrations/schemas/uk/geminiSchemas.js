export const FILM_RECOMMENDATIONS_SCHEMA = {
    type: 'object',
    properties: {
        films: {
            type: 'array',
            minItems: 5,
            maxItems: 5,
            items: {
                type: 'object',
                properties: {
                    position: {
                        type: 'integer',
                        description: 'Позиція фільму у списку від 1 до 5',
                    },
                    title: {
                        type: 'string',
                        description: 'Назва фільму (локалізована або міжнародна)',
                    },
                    original_title: {
                        type: 'string',
                        description: 'Оригінальна назва латинськими літерами',
                    },
                    year: {
                        type: 'integer',
                        description: 'Рік виходу фільму',
                    },
                    type: {
                        type: 'string',
                        enum: ['movie', 'tv'],
                        description: 'Тип: художній фільм або серіал',
                    },
                    tmdb_id: {
                        type: ['integer', 'null'],
                        description: 'TMDB ID фільму, якщо відомий, інакше null',
                    },
                    imdb_id: {
                        type: ['string', 'null'],
                        description: 'IMDB ID, якщо відомий, інакше null',
                    },
                    overview: {
                        type: 'string',
                        description: 'Короткий опис сюжету без спойлерів, 1-3 речення',
                    },
                    why_recommended: {
                        type: 'string',
                        description: 'Чому цей фільм підходить саме цьому користувачу',
                    },
                    mood_tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Список тегів настрою (наприклад, романтичний, тривожний)',
                    },
                    content_warnings: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Важливі контент-попередження (насильство, самогубство тощо)',
                    },
                },
                required: ['position', 'title', 'year', 'type', 'overview'],
                additionalProperties: false,
            },
        },
    },
    required: ['films'],
    additionalProperties: false,
};
