import { Markup } from 'telegraf';
import { LibraryService } from '../../services/LibraryService.js';
import { UserService as UsersService } from '../../services/UserService.js';

async function showLibraryPage(ctx) {
    const { view = 'watchLater', page = 1 } = ctx.session;
    const limit = 5;

    const { films, totalPages, totalCount } =
        await LibraryService.getUserFilmsPaginated(ctx.from.id, view, page, limit);
    const user = await UsersService.getByTelegramId(ctx.from.id);

    ctx.session.totalPages = totalPages;


    const switchButtons = [
        Markup.button.callback(
            view === 'watchLater' ? '📺 На потім ✅' : '📺 На потім',
            'SWITCH_WATCH_LATER',
        ),
        Markup.button.callback(
            view === 'watched' ? '👁 Переглянуті ✅' : '👁 Переглянуті',
            'SWITCH_WATCHED',
        ),
    ];

    // --- Якщо список порожній ---
    if (!films.length) {
        const emptyText =
            view === 'watchLater' ?
                '📭 Список “подивитись пізніше” порожній.' :
                '👁 Ти ще не додав переглянуті фільми.';

        const emptyKeyboard = Markup.inlineKeyboard([
            switchButtons,
        ]);

        console.log(emptyKeyboard);

        await ctx
            .editMessageText?.(emptyText, { parse_mode: 'Markdown', ...emptyKeyboard })
            .catch(async () => {
                await ctx.reply(emptyText, { parse_mode: 'Markdown', ...emptyKeyboard });
            });
        return;
    }

    // --- Формуємо список як інлайн-клавіатуру ---
    const filmButtons = await Promise.all(
        films.map(async (f) => {
            const starred = await LibraryService.isStarred(user._id, f._id) ? '⭐️ ' : '';
            const disliked = await LibraryService.isDisliked(user._id, f._id) ? '🥀 ' : '';
            return [Markup.button.callback(
                `${starred}${disliked}${f.title}${f.year ? ` (${f.year})` : ''}`,
                `OPEN_FILM_${f._id}`,
            )];
        }));

    const navButtons = (totalPages > 1) ? [
        Markup.button.callback('⬅', 'PREV_PAGE'),
        Markup.button.callback(`📄 ${page}/${totalPages}`, 'FAKE_BUTTON'),
        Markup.button.callback('➡', 'NEXT_PAGE'),
    ] : [];

    const keyboard = Markup.inlineKeyboard([
        switchButtons,
        ...filmButtons,
        navButtons,
    ]);

    const header =
        view === 'watchLater' ?
            '📺 *Подивитись пізніше:*' :
            '👁 *Переглянуті фільми:*';

    const text = `${header}\n\n📄 Сторінка ${page} з ${totalPages} · ${totalCount} фільмів`;

    await ctx
        .editMessageText?.(text, { parse_mode: 'Markdown', ...keyboard })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
        });
}

export { showLibraryPage };
