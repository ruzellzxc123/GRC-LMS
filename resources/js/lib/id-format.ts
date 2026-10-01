/**
 * Professor IDs are shorter than student IDs — 7 digits total, grouped
 * 4-3 (e.g. 0000-000) — but still auto-hyphenate as you type, same as
 * every other ID field in this app.
 */
export function formatProfessorId(rawValue: string): string {
    const digits = rawValue.replace(/\D/g, '').slice(0, 7);

    return [digits.slice(0, 4), digits.slice(4, 7)].filter(Boolean).join('-');
}
