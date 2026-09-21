import { Head, Link } from '@inertiajs/react';
import { ClipboardList, GraduationCap, Users } from 'lucide-react';

interface CourseSummary {
    id: number;
    subject: string;
    course_code: string | null;
    enrollments_count: number;
    quizzes_count: number;
}

interface GradesIndexProps {
    courses: CourseSummary[];
}

export default function GradesIndex({ courses }: GradesIndexProps) {
    return (
        <>
            <Head title="Grading System" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <GraduationCap className="size-4" />
                            Grading System
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Grades by Subject
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Every subject you teach has its own grade section —
                            set the weight breakdown and view each student's
                            grade there.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {courses.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {courses.map((course) => (
                                    <Link
                                        key={course.id}
                                        href={`/professor/courses/${course.id}/grades/prelims`}
                                        className="flex items-center justify-between gap-3 p-5 hover:bg-red-50/40"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-900">
                                                {course.subject}
                                                {course.course_code
                                                    ? ` (${course.course_code})`
                                                    : ''}
                                            </p>
                                            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="size-3.5" />
                                                    {course.enrollments_count}{' '}
                                                    students
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <ClipboardList className="size-3.5" />
                                                    {course.quizzes_count}{' '}
                                                    quizzes
                                                </span>
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-red-700">
                                            View Grades →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <GraduationCap className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No subjects assigned yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ask an admin to assign you to a subject.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
