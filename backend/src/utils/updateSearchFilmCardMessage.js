async function updateSearchFilmCardMessage(ctx, film, caption, keyboard) {
    const msg = ctx.callbackQuery?.message ?? ctx.message;

    const hasPosterNow = !!msg?.photo?.length;
    const wantsPoster = !!film.posterUrl;

    if (hasPosterNow && wantsPoster) {
        await ctx.editMessageMedia(
            {
                type: 'photo',
                media: film.posterUrl,
                caption,
                parse_mode: 'HTML',
            },
            {
                reply_markup: keyboard.reply_markup,
            },
        );
        return;
    }

    if (!hasPosterNow && !wantsPoster) {
        await ctx.editMessageText(caption, {
            parse_mode: 'HTML',
            ...keyboard,
        });
        return;
    }

    if (msg) {
        await ctx.telegram.deleteMessage(msg.chat.id, msg.message_id);
    }

    if (wantsPoster) {
        await ctx.replyWithPhoto(film.posterUrl, {
            caption,
            parse_mode: 'HTML',
            ...keyboard,
        });
    } else {
        await ctx.reply(caption, {
            parse_mode: 'HTML',
            ...keyboard,
        });
    }
}

export default updateSearchFilmCardMessage;
