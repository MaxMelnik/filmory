/**
 * Escapes reserved characters from input string. Necessary for ctx.replyWithMarkdownV2()
 * @param {string} text - input string
 * @return {string} - input string with escaped reserved characters
 */
function escapeReservedCharacters(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}


export default escapeReservedCharacters;
