import { getMovieDetails, getTvDetails, searchAllByMediaType } from '../../services/integrations/tmdbClient.js';
import { Markup } from 'telegraf';
import { FilmService } from '../../services/FilmService.js';
import { UserService } from '../../services/UserService.js';
import logger from '../../utils/logger.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getFilmByUserDescription } from '../../services/integrations/geminiService.js';
import { isRequestAllowed } from '../../services/system/QuotaService.js';
import { LibraryService } from '../../services/LibraryService.js';

export async function handleAddFilm(ctx) {
    logger.info(`[ADD FILM SCENE ENTERED] @${ctx.from.username || ctx.from.id}`);
    const user = await UserService.getOrCreateUserFromCtx(ctx);

    if (ctx.session.filmId) {
        const film = await FilmService.getById(ctx.session.filmId);

        ctx.session.filmId = null;
        if (!film) return ctx.reply('Пошкоджене посилання. Спробуй знайти фільм вручну: /add');

        ctx.scene.state.film = film;
        ctx.session.title = film.title;

        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📼 Подивитись пізніше', 'ADD_WATCH_LATER')],
            [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
            [Markup.button.callback(`📝 Лише назву "${film.title}"`, `SAVE_MANUAL`)],
            [Markup.button.callback('👾 Знайти схожі фільми', `RECOMMEND_${film._id}`)],
            [Markup.button.callback('🔗 Поділитись', `SHARE_${film._id}`)],
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]);

        const rating = await LibraryService.getRating(user._id, film._id);
        const userRating = rating ? `Твоя оцінка: ⭐ ${rating}/10\n\n` : ``;
        const tmdbRating = film.tmdbRate ? `Оцінка TMDB: 💙 ${film.tmdbRate}/10\n\n` : ``;

        const caption = `<b>${film.title}</b>${film.originalTitle ? ` / <i>${film.originalTitle}</i> ` : ''} (${film.year || '?'})\n\n` +
            userRating + tmdbRating +
            `${film.description ? `${film.description}\n\n` : ''}Як зберегти цей фільм?`;

        if (film.posterUrl) {
            await ctx.replyWithPhoto(film.posterUrl, {
                caption,
                parse_mode: 'HTML',
                ...keyboard,
            });
        } else {
            await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
        }
        return;
    }

    ctx.session = ctx.session || {};
    ctx.session.awaitingFilmTitle = true;
    ctx.scene.state.inputType = 'title';

    const isPlus = await UserService.isPlus(ctx.from.id);
    const isPlusSymbol = isPlus ? '⭐' : '🔒';

    const text = `✍ Напиши назву фільму, який хочеш додати\\.

Якщо маєш *⭐ Filmory Plus*, то можеш натиснути "🤔 Не пам'ятаю назву" і я знайду фільм за твоїми спогадами\\.
`;

    const keyboard = [
        [{ text: `✍ Знайти за назвою`, callback_data: 'SEARCH_NEW_BY_TITLE_EDIT' }],
        [{ text: `🤔 Не пам'ятаю назву ${isPlusSymbol}`, callback_data: isPlus ? 'SEARCH_NEW_BY_DESCRIPTION' : 'PLUS_REC_CAT' }],
        [{ text: `🏠︎ На головну`, callback_data: 'GO_HOME_AND_DELETE_MESSAGE' }],
    ];

    if (!ctx.session.editMessageText) {
        return await ctx.replyWithMarkdownV2(text, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    }

    ctx.session.editMessageText = false;

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

export async function handleFilmTitleInput(ctx) {
    const title = ctx.message?.text?.trim() ?? ctx.session.title;
    if (ctx.message?.text) {
        ctx.scene.state.filmIndex = 0;
    }

    if (!ctx.session?.awaitingFilmTitle) return;

    ctx.session.title = title;
    logger.info(`Search Film by title @${ctx.from.username}: ${title}`);
    const films = await searchAllByMediaType(title);
    ctx.scene.state.films = films ?? [];
    ctx.scene.state.filmIndex ??= 0;
    if (!films || !films[ctx.scene.state.filmIndex]) {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(`📝 Зберегти як "${title}"`, `SAVE_MANUAL`)],
            [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
        ]);
        return ctx.reply('Не знайшов такого фільму на TMDB 😢', keyboard);
    }
    const found = films[ctx.scene.state.filmIndex];

    const details = (found.mediaType === 'movie') ?
        await getMovieDetails(found.tmdbId) :
        await getTvDetails(found.tmdbId);

    const film = await FilmService.upsertFromTmdb({
        tmdbId: found.tmdbId,
        title: found.title,
        original_title: found.original_title,
        year: found.year,
        posterUrl: found.posterUrl,
        overview: found.overview,
        tmdbRate: found.tmdbRate,
        genres: details.genres,
        duration: details.runtime,
    });
    ctx.scene.state.film = film;

    const navButtons = (films.length > 1) ? [
        Markup.button.callback('⬅', 'PREV_FILM_SEARCH'),
        Markup.button.callback(`📄 ${ctx.scene.state.filmIndex + 1}/${films.length}`, 'FAKE_BUTTON'),
        Markup.button.callback('➡', 'NEXT_FILM_SEARCH'),
    ] : [];

    const keyboard = Markup.inlineKeyboard([
        navButtons,
        [Markup.button.callback('📼 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback(`📝 Лише назву "${title}"`, `SAVE_MANUAL`)],
        [Markup.button.callback('👾 Знайти схожі фільми', `RECOMMEND_${film._id}`)],
        [Markup.button.callback('🔗 Поділитись', `SHARE_${film._id}`)],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);

    const user = await UserService.getByTelegramId(ctx.from.id);
    const rating = await LibraryService.getRating(user._id, film._id);
    const userRating = rating ? `Твоя оцінка: ⭐ ${rating}/10\n\n` : ``;
    const tmdbRating = film.tmdbRate ? `Оцінка TMDB: 💙 ${film.tmdbRate}/10\n\n` : ``;

    const caption = `<b>${film.title}</b>${film.originalTitle ? ` / <i>${film.originalTitle}</i> ` : ''} (${film.year || '?'})\n\n` +
        userRating + tmdbRating +
        `${film.description ? `${film.description}\n\n` : ''}Як зберегти цей фільм?`;

    if (film.posterUrl) {
        await ctx.replyWithPhoto(film.posterUrl, {
            caption,
            parse_mode: 'HTML',
            ...keyboard,
        });
    } else {
        await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
    }
}

export async function searchNewFilmByUserDescription(ctx) {
    ctx.session = ctx.session || {};
    ctx.session.awaitingFilmTitle = false;
    ctx.scene.state.inputType = 'description';

    const keyboard = [
        [{ text: '⬅ Назад', callback_data: 'GO_SEARCH_FILM_AND_DELETE_MESSAGE' }],
    ];
    const text = escapeReservedCharacters(`Не біда! Введи деталі фільму, які пам'ятаєш, а я спробую його знайти:`);
    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
    await ctx.answerCbQuery();
}

export async function searchNewFilmByTitleMessageUpdate(ctx) {
    const keyboard = [
        [{ text: '⬅ Назад', callback_data: 'GO_SEARCH_FILM_AND_DELETE_MESSAGE' }],
    ];
    const text = `✍ Напиши назву фільму, який хочеш додати\\.`;
    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch((err) => {
            logger.warn(`searchNewFilmByTitleMessageUpdate message wasn't updated: ${err.message}`);
        });
    await ctx.answerCbQuery();
}

export async function handleFilmDescriptionInput(ctx) {
    const description = ctx.message?.text?.trim();
    logger.info(`Search Film by description @${ctx.from.username}: ${description}`);

    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    void showWaiter(ctx, {
        message: `Шукаю фільми за описом "${description}"`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getFilmByUserDescription(description),
        onDone: async (ctx, response) => await (ctx, `🎬 Опису "${description}" відповідають наступні фільми:`, response),
    });
}
