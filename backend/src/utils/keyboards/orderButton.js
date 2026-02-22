import { Markup } from 'telegraf';

const ORDER_LABEL = {
    recent: '🕒 Останні додані',
    title_az: '🔤 За алфавітом',
    year_new: '📅 Свіжі релізи',
    rating_high: '⭐ За оцінкою',
};

const ORDER_CYCLE = {
    watchLater: ['recent', 'title_az', 'year_new'],
    watched: ['recent', 'rating_high', 'title_az', 'year_new'],
};

export function nextOrder(view, current = 'recent') {
    const cycle = ORDER_CYCLE[view] || ['recent'];
    let idx = cycle.indexOf(current);
    idx = Math.max(idx, 0);
    return cycle[(idx + 1) % cycle.length];
}

export function buildSortRow(view, order) {
    const label = ORDER_LABEL[order] ?? ORDER_LABEL.recent;
    return [
        Markup.button.callback(`↕️ Сортування: ${label}`, `lib:order:next:${view}:${order}`),
    ];
}
