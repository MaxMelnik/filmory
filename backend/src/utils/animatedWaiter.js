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
    const interval = setInterval(async () => {
        frameIndex = (frameIndex + 1) % frames.length;
        let animatedText;

        if (animation === 'phrases') {
            animatedText = frames[frameIndex];
        } else {
            animatedText = `${message} ${frames[frameIndex]}`;
        }

        try {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                initial.message_id,
                undefined,
                animatedText,
            );
        } catch (e) {
            console.error('⚠️ Animated waiter update error:', e.message);
            clearInterval(interval);
        }
    }, delay);

    try {
        // 🧠 Виконуємо асинхронну задачу
        const result = await asyncTask();

        // 🛑 Зупиняємо анімацію
        clearInterval(interval);

        // ✅ Оновлюємо повідомлення після завершення
        const finalText = typeof onDone === 'function'
            ? onDone(result)
            : `✅ Завершено:\n\n${result}`;

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            initial.message_id,
            undefined,
            finalText,
        );
    } catch (error) {
        clearInterval(interval);
        console.error('❌ Animated waiter failed:', error);

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            initial.message_id,
            undefined,
            '⚠️ Сталася помилка під час отримання результату.',
        );
    }
}
