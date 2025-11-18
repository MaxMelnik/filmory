import { UserService } from '../../services/UserService.js';
import { FilmService } from '../../services/FilmService.js';

export async function setRateAddFilm(ctx) {
    const rate = parseInt(ctx.match[1]);
    const filmId = parseInt(ctx.match[2]);
    const film = ctx.scene.state.film;
    const user = await UserService.getByTelegramId(ctx.from.id);
    await FilmService.addToLibrary(user._id, filmId, 'watched', rate);

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup();
    await ctx.reply(
        `⭐ Оцінив <b>${film.title}</b> на ${rate}/10. Гарний вибір!`,
        { parse_mode: 'HTML' },
    );
    await ctx.scene.leave();
}
