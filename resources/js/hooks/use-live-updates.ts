import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

/**
 * Silently refetches the current Inertia page's props whenever anything a
 * professor/admin/student changed for this course broadcasts — new module,
 * new quiz, a grade, a submission being graded, a student's own submission.
 * No visible reload; the page just updates with fresh data in place.
 */
export function useCourseUpdates(coursewareId: number | null | undefined) {
    useEcho(
        coursewareId ? `course.${coursewareId}` : '',
        '.course.updated',
        () => {
            router.reload();
        },
    );
}

/**
 * Same idea as useCourseUpdates, but for the global calendar announcements
 * channel — any admin add/remove refreshes every open calendar instantly.
 */
export function useAnnouncementUpdates() {
    useEcho('announcements', '.announcements.updated', () => {
        router.reload();
    });
}

/**
 * A page showing several courses at once (e.g. a scores or dashboard page
 * listing every subject a student is in) can't call useCourseUpdates in a
 * loop — hooks can't be conditional/repeated like that. Rendering one of
 * these per course id instead gives each its own hook call under the hood.
 */
export function CourseUpdatesListener({ coursewareId }: { coursewareId: number }) {
    useCourseUpdates(coursewareId);

    return null;
}
