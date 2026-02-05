/**
 * Generate progressbar in text representation
 * @param {number} percentage - current percents of progress
 * @param {number} [totalLength=20] - number of characters to represent 100% progress
 * @param {string} [filledChar = '█'] - symbol to represent completed part
 * @param {string} [unfilledChar = '░'] - symbol to represent uncompleted part
 * @return {string} Progressbar in string representation
 */
export default function generateProgressBar(percentage, totalLength = 20, filledChar = '█', unfilledChar = '░') {
    const filledLength = Math.round((percentage / 100) * totalLength);
    const unfilledLength = totalLength - filledLength;

    const filledPart = filledChar.repeat(filledLength);
    const unfilledPart = unfilledChar.repeat(unfilledLength);

    return `[${filledPart}${unfilledPart}] ${percentage}%`;
}
