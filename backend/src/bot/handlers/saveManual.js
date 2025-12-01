import { FilmService } from '../../services/FilmService.js';
import { Markup } from 'telegraf';
import logger from '../../utils/logger.js';

export async function saveManual(ctx) {
    const title = ctx.session.title;
    ctx.session.title = null;
    ctx.scene.state.film = await FilmService.createManual(title);
    await ctx.answerCbQuery();

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📼 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
    ]);

    try {
        const caption = `“${title}”\n\nЯк зберегти цей фільм?`;
        if (ctx.update.callback_query.message.photo) {
            const keyboardOptions = {
                parse_mode: 'Markdown',
                ...keyboard,
            };
            await ctx.editMessageCaption(caption, keyboardOptions);
        } else {
            await ctx.editMessageText(caption, keyboard);
        }
    } catch (e) {
        logger.error('⚠️ Не вдалося оновити повідомлення:', e.message);
    }
}
