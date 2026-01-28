import { Markup } from 'telegraf';
import logger from './logger.js';

const activeJobs = new Map();

function startWaitLoop({ telegram, chatId, messageId, message, frames, animation, delay }) {
    let frameIndex = 0;
    let stopped = false;

    const tick = async () => {
        if (stopped) return;

        frameIndex = (frameIndex + 1) % frames.length;
        const animatedText = animation === 'phrases'
            ? frames[frameIndex]
            : `${message} ${frames[frameIndex]}`;

        try {
            await telegram.editMessageText(chatId, messageId, undefined, animatedText);
        } catch (e) {
            logger.error('⚠️ Animated waiter update error:', e.message);
            stopped = true;
            return;
        }

        setTimeout(tick, delay);
    };

    setTimeout(tick, delay);

    return () => {
        stopped = true;
    };
}

/**
 * Animated waiter for Telegraf
 *
 * Usage:
 * await showWaiter(ctx, {
 *   message: `Шукаю фільми схожі на "${movieName}"`,
 *   animation: "dots", // "dots" | "emoji" | "phrases"
 *   delay: 600,
 *   asyncTask: async () => await geminiClient.getRecommendations(movieName),
 *   onDone: (result) => `🎬 Фільми схожі на "${movieName}":\n\n${result}`
 * });
 */
export async function showWaiter(ctx, {
    message,
    animation = 'dots',
    delay = 600,
    asyncTask,
    onDone,
}) {
    const key = ctx.chat.id;

    if (activeJobs.has(key)) {
        await ctx.reply('⏳ Вже шукаю рекомендацію. Зачекай трохи 🙂');
        return;
    }

    activeJobs.set(key, true);

    try {
        const animations = {
            dots: ['.', '..', '...', '…'],
            emoji: ['🎬', '🍿', '🎞️', '🎥'],
            phrases: [
                'Аналізую смаки користувача...',
                'Переглядаю базу фільмів...',
                'Підбираю щось подібне...',
                'Згадую схожі сюжети...',
            ],
        };

        const frames = animations[animation] || animations.dots;
        let frameIndex = 0;

        // 🟢 Початкове повідомлення
        const initial = await ctx.reply(`${message} ${frames[frameIndex]}`);

        // 🔁 Анімація
        const stop = startWaitLoop({
            telegram: ctx.telegram,
            chatId: ctx.chat.id,
            messageId: initial.message_id,
            message,
            frames,
            animation,
            delay,
        });

        try {
            // 🧠 Виконуємо асинхронну задачу
            const result = await asyncTask();

            // 🛑 Зупиняємо анімацію
            stop();

            // ✅ Оновлюємо повідомлення після завершення
            ctx.session.activeRecommendation = 1;
            ctx.session.messageId = initial.message_id;
            let { finalText, keyboard } = typeof onDone === 'function' ?
                await onDone(ctx, result) :
                { finalText: result };

            keyboard ??= Markup.inlineKeyboard([
                [Markup.button.callback('🏠︎ На головну', 'GO_HOME_AND_CLEAR_KEYBOARD')],
            ]);

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                initial.message_id,
                undefined,
                finalText,
                {
                    parse_mode: 'Markdown',
                    ...keyboard,
                },
            ).catch(async () => {
                stop();
                await ctx.reply(finalText, { parse_mode: 'Markdown', ...keyboard });
            });

        } catch (error) {
            clearInterval(interval);
            logger.error('❌ Animated waiter failed:', error);

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                initial.message_id,
                undefined,
                '⚠️ Сталася помилка під час отримання результату.',
            );
        }
    } finally {
        activeJobs.delete(key);
    }
}
