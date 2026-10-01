import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, LayoutDashboard, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useInitials } from '@/hooks/use-initials';

interface Course {
    id: number;
    subject: string;
    module_title: string;
    professor: string;
    professor_avatar: string | null;
    section: string | null;
    today_hyflex_mode: 'f2f' | 'online' | null;
}

// A stable, non-configurable color per subject (keyed off its id, not
// randomized) so each card keeps the same banner color across reloads —
// purely a visual variety touch, not tied to any subject property. Kept
// entirely within the app's red/white brand palette (varying shade/warmth
// only) instead of introducing unrelated brand colors like teal or indigo.
const BANNER_GRADIENTS = [
    'from-red-700 to-red-500',
    'from-rose-700 to-rose-500',
    'from-red-900 to-red-700',
    'from-orange-700 to-red-600',
    'from-rose-800 to-red-600',
    'from-red-600 to-orange-500',
    'from-red-800 to-rose-600',
    'from-rose-600 to-orange-500',
];

interface EnrollableCourse {
    id: number;
    subject: string;
    subject_code: string | null;
    professor: string;
    module_title: string;
}

interface EnrollSearch {
    query: string;
    results: EnrollableCourse[];
}

interface CoursesIndexProps {
    courses: Course[];
    enroll_search: EnrollSearch;
}

export default function CoursesIndex({
    courses,
    enroll_search,
}: CoursesIndexProps) {
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [search, setSearch] = useState('');
    const getInitials = useInitials();

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/student/courses',
            { search },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['enroll_search'],
            },
        );
    };

    const enroll = (coursewareId: number) => {
        router.post(
            '/student/enrollments',
            { courseware_id: coursewareId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowEnrollModal(false);
                    setSearch('');
                },
            },
        );
    };

    return (
        <>
            <Head title="My Subjects" />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <LayoutDashboard className="size-4" />
                                    My Subjects
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    Enrolled Subjects
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    {courses.length} subject
                                    {courses.length === 1 ? '' : 's'} enrolled
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowEnrollModal(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <Plus className="size-4" />
                                Enroll in a Subject
                            </button>
                        </div>
                    </section>

                    {courses.length > 0 ? (
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {courses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/student/courses/${course.id}`}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                >
                                    <div
                                        className={`relative bg-gradient-to-br p-4 pb-8 ${
                                            BANNER_GRADIENTS[
                                                course.id %
                                                    BANNER_GRADIENTS.length
                                            ]
                                        }`}
                                    >
                                        <h3 className="line-clamp-2 pr-10 text-lg font-bold text-white">
                                            {course.subject}
                                        </h3>
                                        <p className="mt-1 text-sm text-white/80">
                                            Section{' '}
                                            {course.section ?? 'Unassigned'}
                                        </p>
                                        <Avatar className="absolute right-4 -bottom-5 size-11 border-2 border-white shadow-sm">
                                            <AvatarImage
                                                src={
                                                    course.professor_avatar ??
                                                    undefined
                                                }
                                                alt={course.professor}
                                            />
                                            <AvatarFallback className="bg-white text-sm font-semibold text-slate-700">
                                                {getInitials(
                                                    course.professor,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="px-4 pt-7 pb-4">
                                        <p className="truncate text-sm text-slate-600">
                                            {course.module_title}
                                        </p>
                                        <p className="mt-1 truncate text-xs text-slate-500">
                                            Prof. {course.professor}
                                        </p>
                                        {course.today_hyflex_mode && (
                                            <span
                                                className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    course.today_hyflex_mode ===
                                                    'f2f'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-cyan-100 text-cyan-700'
                                                }`}
                                            >
                                                Today:{' '}
                                                {course.today_hyflex_mode ===
                                                'f2f'
                                                    ? 'Face-to-Face'
                                                    : 'Synchronous'}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <BookOpen className="mx-auto size-10 text-slate-300" />
                            <h3 className="mt-3 font-semibold text-slate-700">
                                No subjects yet
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Your enrolled subjects will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
                <DialogContent className="max-w-xl gap-4 p-0">
                    <div className="border-b border-slate-200 p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <BookOpen className="size-5 text-red-600" />
                            Enroll in a Subject
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-slate-500">
                            Search by subject code to find a subject, then
                            enroll yourself.
                        </DialogDescription>
                    </div>

                    <div className="px-6">
                        <form onSubmit={submitSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Enter subject code..."
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                                {search !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-red-600"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto px-6 pb-6">
                        {enroll_search.results.length > 0 ? (
                            enroll_search.results.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex items-center justify-between gap-3 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-slate-900">
                                            {course.subject}
                                            {course.subject_code
                                                ? ` (${course.subject_code})`
                                                : ''}
                                        </p>
                                        <p className="truncate text-sm text-slate-600">
                                            {course.module_title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Professor: {course.professor}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => enroll(course.id)}
                                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                    >
                                        <Plus className="size-4" />
                                        Enroll
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <BookOpen className="mx-auto size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    {enroll_search.query
                                        ? 'No subject found'
                                        : 'Search for a subject'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {enroll_search.query
                                        ? 'Check the subject code and try again.'
                                        : 'Enter the subject code above to find a subject to enroll in.'}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
