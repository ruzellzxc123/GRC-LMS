export function formatTime12h(hhmm: string): string {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}
