export default function makeMovieDeepLink(id) {
    return `https://t.me/${process.env.BOT_USERNAME}?start=movie_${id}`;
}
