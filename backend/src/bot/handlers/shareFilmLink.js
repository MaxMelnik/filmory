import makeMovieDeepLink from '../../utils/makeMovieDeepLink.js';

export async function shareFilmLink(ctx) {
    const filmId = parseInt(ctx.match[1]);
    const deepLink = makeMovieDeepLink(filmId);

    ctx.answerCbQuery();
    await ctx.reply(deepLink);
}
