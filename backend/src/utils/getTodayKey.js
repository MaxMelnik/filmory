export default function getTodayKey() {
    const days = [
        'sunday',    // 0
        'monday',    // 1
        'tuesday',   // 2
        'wednesday', // 3
        'thursday',  // 4
        'friday',    // 5
        'saturday',  // 6
    ];

    const todayIndex = new Date().getDay(); // 0–6
    return days[todayIndex];
}
