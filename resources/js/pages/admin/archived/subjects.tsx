import { Head, Link } from '@inertiajs/react';
import { Archive, BookOpen, ChevronRight } from 'lucide-react';
import BackLink from '@/components/back-link';

interface AcademicTerm {
    id: number;
    name: string;
    semester: string | null;
}

interface ArchivedCourse {
    id: number;
    subject: string;
    subject_code: string | null;
    module_title: string;
    year_level: string | null;
    section: string | null;
    archived_at: string | null;
    academic_term: AcademicTerm | null;
}

interface Professor {
    id: number;
    name: string;
    email: string;
}

interface ArchivedSubjectsProps {
    professor: Professor;
    courses: ArchivedCourse[];
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function ArchivedSubjects({
    professor,
    courses,
}: ArchivedSubjectsProps) {
    return (
        <>
            <Head title={`Archived Subjects — ${professor.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1100px] space-y-6">
                    <BackLink href="/admin/archived">
                        Back to professors
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Archive className="size-4" />
                            Archived Subjects
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {professor.name}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            {professor.email}
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {courses.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {courses.map((course) => (
                                    <li key={course.id}>
                                        <Link
                                            href={`/admin/archived/subjects/${course.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-red-50/40"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {course.subject}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {course.subject_code ??
                                                        course.module_title}
                                                    {course.section
                                                        ? ` · Section ${course.section}`
                                                        : ''}
                                                    {course.academic_term
                                                        ? ` · ${course.academic_term.name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500">
                                                    Archived{' '}
                                                    {formatDate(
                                                        course.archived_at,
                                                    )}
                                                </span>
                                                <ChevronRight className="size-4 text-slate-400" />
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <BookOpen className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No archived subjects
                                </h3>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
