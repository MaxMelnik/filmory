import { FilmService } from '../../services/FilmService.js';
import { Markup } from 'telegraf';

export async function saveManual(ctx) {
    const title = ctx.session.title;
    ctx.session.title = null;
    ctx.scene.state.film = await FilmService.createManual(title);
    await ctx.answerCbQuery();

    console.log(title);

    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🎞 Подивитись пізніше', 'ADD_WATCH_LATER')],
        [Markup.button.callback('✅ Вже переглянуто', 'ADD_WATCHED')],
        [Markup.button.callback('⬅ Назад', 'GO_BACK')],
    ]);

    try {
        if (ctx.update.callback_query.message.photo) {
            const caption = `“${title}”\n\nЩо зробимо з цим фільмом?`;
            const keyboardOptions = {
                parse_mode: 'Markdown',
                ...keyboard,
            };
            await ctx.editMessageCaption(caption, keyboardOptions);
        } else {
            await ctx.editMessageText(`“${title}”\n\nЩо зробимо з цим фільмом?`, keyboard);
        }
    } catch (e) {
        console.error('⚠️ Не вдалося оновити повідомлення:', e.message);
    }
}
