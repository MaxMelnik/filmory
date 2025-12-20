export default function formatRuntime(minutes) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (!h) return `${m} хв`;
    if (!m) return `${h} год`;
    return `${h} год ${m} хв`;
}
