/**
 * The last day of the 18th week starting from a term's start date (a
 * standard semester length), as a "YYYY-MM-DD" string ready for a date
 * input. Week 1 is the 7 days starting on startDate, so the 18th week ends
 * 125 days later.
 */
export function lastDayOfWeek18(startDate: string): string {
    if (!startDate) {
        return '';
    }

    const [year, month, day] = startDate.split('-').map(Number);

    if (!year || !month || !day) {
        return '';
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + 18 * 7 - 1);

    return date.toISOString().slice(0, 10);
}
