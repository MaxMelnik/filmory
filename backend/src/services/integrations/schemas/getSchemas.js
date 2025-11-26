export async function getSchemas(lang = 'uk') {
    const { FILM_RECOMMENDATIONS_SCHEMA } = await import(
        `./${lang}/geminiSchemas.js`
    );
    return { FILM_RECOMMENDATIONS_SCHEMA };
}
