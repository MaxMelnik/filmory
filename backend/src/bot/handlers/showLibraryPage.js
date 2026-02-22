import { Markup } from 'telegraf';
import { LibraryService } from '../../services/LibraryService.js';
import { UserService as UsersService } from '../../services/UserService.js';
import { getWatchedMessage, getWatchlistMessage } from '../../utils/templates/libraryMessages.js';
import { buildSortRow } from '../../utils/keyboards/orderButton.js';

async function showLibraryPage(ctx) {
    const { view = 'watchLater', page = 1 } = ctx.session;
    const limit = 5;
    const order = ctx.session.order;

    const { films, totalPages, totalCount } =
        await LibraryService.getUserFilmsPaginated(ctx.from.id, view, page, limit, order);
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

    const homeButtons = [
        Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_DELETE_MESSAGE'),
    ];

    if (!films.length) {
        const emptyText =
            view === 'watchLater' ?
                '📭 Список “подивитись пізніше” порожній.' :
                '👁 Ти ще не додав переглянуті фільми.';

        const emptyKeyboard = Markup.inlineKeyboard([
            switchButtons,
            homeButtons,
        ]);

        await ctx
            .editMessageText?.(emptyText, { parse_mode: 'Markdown', ...emptyKeyboard })
            .catch(async () => {
                await ctx.reply(emptyText, { parse_mode: 'Markdown', ...emptyKeyboard });
            });
        return;
    }

    const orderButtons = buildSortRow(view, order);

    const filmButtons = await Promise.all(
        films.map(async (f) => {
            const starred = await LibraryService.isStarred(user._id, f._id) ? '⭐️ ' : '';
            const disliked = await LibraryService.isDisliked(user._id, f._id) ? '🥀 ' : '';
            return [Markup.button.callback(
                `${starred}${disliked}${f.title}${f.year ? ` (${f.year})` : ''}`,
                `OPEN_FILM_${f._id}`,
            )];
        }));

    const rndButtons = (films.length > 1) ? [
        Markup.button.callback(
            '🎲 Мені пощастить',
            'OPEN_FILM_RND',
        ),
    ] : [];

    const fakeButtons = (films.length > 1) ? [
        Markup.button.callback(
            ' ',
            'FAKE_BUTTON',
        ),
    ] : [];

    const navButtons = (totalPages > 1) ? [
        Markup.button.callback('⬅', 'PREV_PAGE'),
        Markup.button.callback(`📄 ${page}/${totalPages}`, 'FAKE_BUTTON'),
        Markup.button.callback('➡', 'NEXT_PAGE'),
    ] : [];

    const keyboard = Markup.inlineKeyboard([
        orderButtons,
        switchButtons,
        ...filmButtons,
        fakeButtons,
        rndButtons,
        homeButtons,
        navButtons,
    ]);

    const header =
        view === 'watchLater' ?
            '📺 *Подивитись пізніше:*' :
            '👁 *Переглянуті фільми:*';

    const statsMessage =
        view === 'watchLater' ?
            `${getWatchlistMessage(null, totalCount)}\n\n` :
            `${getWatchedMessage(null, totalCount)}\n\n`;

    const text = `${header}\n\n${statsMessage}Натисни *«🎲 Мені пощастить»*, щоб Filmory обрав випадковий фільм із твого списку *«На потім»*\\.` +
        `\n\n📄 Сторінка ${page} з ${totalPages} · ${totalCount} фільмів`;

    await ctx
        .editMessageText?.(text, { parse_mode: 'MarkdownV2', ...keyboard })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'MarkdownV2', ...keyboard });
        });
}

export { showLibraryPage };
