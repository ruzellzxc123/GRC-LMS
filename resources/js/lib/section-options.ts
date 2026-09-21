export function getSectionOptions(yearLevel: string): string[] {
    const prefix = yearLevel.charAt(0);

    if (!/^[1-9]$/.test(prefix)) {
        return [];
    }

    return Array.from({ length: 9 }, (_, index) => `${prefix}0${index + 1}`);
}
