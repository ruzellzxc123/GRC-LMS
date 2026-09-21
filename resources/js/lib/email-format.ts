export function appendGmailDomain(rawValue: string): string {
    const value = rawValue.trim();

    if (value === '' || value.includes('@')) {
        return value;
    }

    return `${value}@gmail.com`;
}
