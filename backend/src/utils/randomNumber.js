export default function randomNumber(min, max) {
    const from = Math.ceil(min);
    const to = Math.floor(max);
    return Math.floor(Math.random() * (to - from + 1)) + from;
}
