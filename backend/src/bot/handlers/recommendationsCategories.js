import logger from '../../utils/logger.js';
import { Markup } from 'telegraf';
import { isRequestAllowed } from '../../services/system/QuotaService.js';
import { UserService } from '../../services/UserService.js';
import { LibraryService } from '../../services/LibraryService.js';
import { showWaiter } from '../../utils/animatedWaiter.js';
import { getListOfFilmsRecommendations } from '../../services/integrations/geminiService.js';
import parseRecommendations from '../../utils/parseRecommendations.js';
import escapeReservedCharacters from '../../utils/escapeReservedCharacters.js';

export async function plusOnlyRestriction(ctx) {
    logger.info(`[PLUS ONLY RESTRICTION] @${ctx.from.username || ctx.from.id}`);
    const text = `😌 Схоже у тебе немає активної підписки *Plus*\\.

З *Plus* ти отримаєш додаткові режими рекомендацій
\\(за настроєм, для компанії, спільний перегляд\\)\\.

Можеш оформити *⭐ Filmory Plus* зараз або отримати рекомендації з загальнодоступних категорій 👇
`;
    const keyboard = [
        [{ text: `⭐ Filmory Plus`, callback_data: 'GET_SUBSCRIPTION' }],
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

export async function showPersonalRecommendations(ctx) {
    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    const user = await UserService.getOrCreateUserFromCtx(ctx);

    const favouriteMovies = await LibraryService.getUserFavouriteFilms(user._id, 8);
    const worstMovies = await LibraryService.getUserWorstFilms(user._id, 4);
    const includeFilms = favouriteMovies
        .map(movie => movie.title)
        .filter(Boolean)
        .map(title => `"${title}"`)
        .join(', ');

    const excludeFilms = worstMovies
        .map(movie => movie.title)
        .filter(Boolean)
        .map(title => `"${title}"`)
        .join(', ');

    logger.info(includeFilms);
    logger.info(excludeFilms);

    ctx.answerCbQuery();

    void showWaiter(ctx, {
        message: `Шукаю фільми на основі твоїх вподобань`,
        animation: 'emoji', // "dots", "emoji", "phrases"
        delay: 500,
        asyncTask: async () => await getListOfFilmsRecommendations(includeFilms, excludeFilms),
        onDone: async (ctx, response) => await parseRecommendations(ctx, '🎬 Я знайшов для тебе фільми, які можуть сподобатись:', response),
    });
}

export async function showSimilarRecommendations(ctx) {
    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    ctx.scene.state.recCat = 'show_similar';
    const text = escapeReservedCharacters(`🎬 Оберемо щось схоже на конкретний фільм.

Напиши назву фільму, а я підберу кілька варіантів із подібною атмосферою, сюжетом і стилем.
`);
    const keyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

export async function showMoodRecommendations(ctx) {
    if (!await UserService.isPlus(ctx.from.id)) {
        return await plusOnlyRestriction(ctx);
    }

    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    ctx.scene.state.recCat = 'show_mood';
    const text = escapeReservedCharacters(`🌈 Підберемо фільм під твій настрій.

Напиши кількома словами, чого хочеться зараз.

• «щось легке й затишне, щоб розслабитись після роботи»
• «темний психологічний трилер, щоб мозок вибухнув»
• «страшний хоррор, але без занадто жорстких сцен»
• «ностальгія за 2000-ми, трошки романтики і музика»

Можеш комбінувати настрій, жанр, темп, навіть емоції — я все це врахую в добірці 🎬
`);
    const keyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

export async function showCompanyRecommendations(ctx) {
    if (!await UserService.isPlus(ctx.from.id)) {
        return await plusOnlyRestriction(ctx);
    }

    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    ctx.scene.state.recCat = 'show_company';
    const text = escapeReservedCharacters(`👥 Добре, давай підберемо фільм під компанію.

Напиши, з ким ви дивитесь і який у вас вайб, наприклад:

• «з дівчиною, хочеться романтики без крінжа»
• «з друзями, щось веселе, щоб ржати й не сильно думати»
• «з колегами після роботи, якийсь нейтральний фільм»
• «я сам, хочу щось глибоке й трошки депресивне»

Чим точніше опишеш компанію й настрій вечора — тим краще я попаду в рекомендації 🎯
`);
    const keyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

export async function showCooperativeRecommendations(ctx) {
    if (!await UserService.isPlus(ctx.from.id)) {
        return await plusOnlyRestriction(ctx);
    }

    const getPlusKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⭐ Filmory Plus', 'GET_SUBSCRIPTION')],
    ]);
    const goBackKeyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];
    if (!await isRequestAllowed(ctx, goBackKeyboard, getPlusKeyboard)) return;

    ctx.scene.state.recCat = 'show_coop';
    const text = escapeReservedCharacters(`🤝 Зробимо підбірку, яка сподобається вам двом.

Напиши @username друга або перешли мені будь-яке його повідомлення.
Я порівняю ваші смаки і підберу фільми, які зайдуть вам обом.
`);
    const keyboard = [
        [{ text: `⬅ Назад`, callback_data: 'GO_RECS_AND_DELETE_MESSAGE' }],
    ];

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...Markup.inlineKeyboard(keyboard) });
        });
}

