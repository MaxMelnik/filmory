import { UserService } from '../../services/UserService.js';
import { LibraryService } from '../../services/LibraryService.js';

export async function deleteFromLibrary(ctx) {
    await ctx.answerCbQuery();
    const filmId = parseInt(ctx.match[1]);
    const user = await UserService.getByTelegramId(ctx.from.id);
    await LibraryService.deleteFilmFromUserLibrary(user._id, filmId);

    await ctx.editMessageReplyMarkup();
    await ctx.scene.enter('LIBRARY_SCENE_ID');
}
