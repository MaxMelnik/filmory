export default function stripJsonFence(text = '') {
    return text
        .trim()
        // початок: ```json або ``` + можливі пробіли/переноси
        .replace(/^```(?:json)?\s*/i, '')
        // кінець: ``` + можливі пробіли
        .replace(/\s*```$/, '')
        .trim();
}
