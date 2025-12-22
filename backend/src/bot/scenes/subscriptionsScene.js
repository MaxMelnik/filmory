import { Markup, Scenes } from 'telegraf';
import { showSubscriptions } from '../handlers/showSubscriptions.js';
import { SubscriptionService } from '../../services/SubscriptionService.js';

const scene = new Scenes.BaseScene('SUBSCRIPTIONS_SCENE_ID');

// Enter Subscription Scene
scene.enter(async (ctx) => {
    await showSubscriptions(ctx);
});

scene.action('MANAGE_SUBSCRIPTION', async (ctx) => {
    ctx.session.editMessageText = true;

    const untilLabel = await SubscriptionService.getSubscriptionExpiryLabel(ctx.from.id);

    ctx.answerCbQuery();

    const text = `
    ⭐ Керування підпискою *Filmory Plus*

Твоя підписка оформлена через Telegram, тому:
— гроші списує сам Telegram;
— відмінити автопродовження можна тільки в налаштуваннях Telegram, а не в боті.

Щоб відмінити підписку:

1. Відкрий налаштування Telegram (Settings).
2. Знайди розділ з платежами та підписками  
   (може називатись «Payments», «Subscriptions» або «Payments & Subscriptions» — залежить від мови/платформи).
3. У списку активних підписок знайди Filmory / цього бота.
4. Натисни на підписку та вибери «Cancel subscription» / «Відмінити підписку».

Після відміни:
— підписка залишиться активною до кінця вже оплаченого періоду;
— нові списання більше не відбуватимуться.

Якщо передумаєш — підписку на *Filmory Plus* завжди можна оформити знову прямо тут у боті 💚

Зараз твоя підписка активна до: *${untilLabel}*`;

    const keyboard = [
        [{ text: '⬅ Назад', callback_data: 'GO_SUBS_AND_DELETE_MESSAGE' }],
    ];

    if (!ctx.session.editMessageText) {
        return await ctx.replyWithMarkdown(text, {
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
    }

    ctx.session.editMessageText = false;

    await ctx
        .editMessageText?.(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) })
        .catch(async () => {
            await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
        });
});

export default scene;
