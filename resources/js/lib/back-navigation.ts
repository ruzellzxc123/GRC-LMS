import { router } from '@inertiajs/react';

let visitCount = 0;

if (typeof window !== 'undefined') {
    router.on('navigate', () => {
        visitCount += 1;
    });
}

/**
 * True once the user has made at least one real in-app navigation since this
 * tab loaded — i.e. there's an actual previous page to return to, not just
 * the page they landed on directly (a fresh tab, bookmark, or hard refresh).
 *
 * Inertia's own "navigate" event never fires for that first page load itself
 * (it replaces history rather than pushing, since the URL already matches
 * `window.location`) — only for a real visit afterwards. So `visitCount`
 * starts at 0 on a fresh load, and reaching 1 already means a genuine
 * previous page exists; it does not need to reach 2.
 */
export function hasPreviousPage(): boolean {
    return visitCount >= 1;
}

/**
 * Returns to whichever page the user actually came from, so "Back" never
 * skips over filters, pagination, or scroll position the way a link to a
 * fixed destination would. Falls back to `fallbackHref` when there's no real
 * previous page in this session (e.g. the very first page loaded).
 */
export function goBack(fallbackHref: string): void {
    if (hasPreviousPage()) {
        window.history.back();

        return;
    }

    router.visit(fallbackHref);
}
