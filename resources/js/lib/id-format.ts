export function formatIdNumber(rawValue: string): string {
    const digits = rawValue.replace(/\D/g, '').slice(0, 11);

    return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 11)]
        .filter(Boolean)
        .join('-');
}

/**
 * The part of a student ID after the enrollment-year prefix: 00-00000.
 * The year itself isn't typed — it's fixed to the current year and shown
 * as a locked prefix (see the student ID field in register.tsx).
 */
export function formatStudentIdSuffix(rawValue: string): string {
    const digits = rawValue.replace(/\D/g, '').slice(0, 7);

    return [digits.slice(0, 2), digits.slice(2, 7)].filter(Boolean).join('-');
}
