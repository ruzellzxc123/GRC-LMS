import { useEffect, useState } from 'react';
import CourseCard from '@/components/CourseCard';
import type { Courseware, CoursewareApiResponse } from '@/types/courseware';

function createCourseCode(subject: string): string {
    const words = subject.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return 'COURSE';
    }

    if (words.length === 1) {
        return words[0].substring(0, 6).toUpperCase();
    }

    return words
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 6)
        .toUpperCase();
}

function prepareCourse(course: Courseware): Courseware {
    return {
        ...course,
        code: createCourseCode(course.subject),
        progress: course.progress ?? 0,
    };
}

export default function CourseDashboard() {
    const [courses, setCourses] = useState<Courseware[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const controller = new AbortController();

        async function fetchCourseware(): Promise<void> {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('/api/courseware', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(
                        `Unable to load courses. Server returned ${response.status}.`,
                    );
                }

                const result = (await response.json()) as CoursewareApiResponse;

                if (!result.success) {
                    throw new Error(
                        result.message || 'Unable to retrieve courseware.',
                    );
                }

                const preparedCourses = result.data.map(prepareCourse);

                setCourses(preparedCourses);
            } catch (error: unknown) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                console.error('Courseware fetch error:', error);

                setError(
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void fetchCourseware();

        return () => {
            controller.abort();
        };
    }, []);

    function handleOpenCourse(course: Courseware): void {
        console.log('Opening course:', course);

        // Temporary navigation.
        // Replace this once the individual course page exists.
        // window.location.href = `/courses/${course.id}`;
    }

    return (
        <div className="flex flex-1 flex-col gap-6">
            <header className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold tracking-wider text-red-600 uppercase">
                    Learning Management System
                </p>

                <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            My Courses
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Continue your lessons and monitor your learning
                            progress.
                        </p>
                    </div>

                    <div className="w-fit rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                        <span className="text-sm text-slate-600">
                            Enrolled courses
                        </span>

                        <strong className="ml-3 text-xl text-red-700">
                            {loading ? '—' : courses.length}
                        </strong>
                    </div>
                </div>
            </header>

            {loading && (
                <div
                    className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm"
                    role="status"
                >
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />

                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Loading your courses...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
                    role="alert"
                >
                    <h2 className="font-semibold">
                        Courses could not be loaded
                    </h2>

                    <p className="mt-1 text-sm">{error}</p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && courses.length === 0 && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">
                        No courses available
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Courseware records will appear here after they are added
                        to the database.
                    </p>
                </div>
            )}

            {!loading && !error && courses.length > 0 && (
                <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onOpen={handleOpenCourse}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}
