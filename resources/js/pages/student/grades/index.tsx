import { Head, Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

interface SubjectSummary {
    id: number;
    subject: string;
}

interface GradesIndexProps {
    subjects: SubjectSummary[];
}

export default function GradesIndex({ subjects }: GradesIndexProps) {
    return (
        <>
            <Head title="Grades" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <GraduationCap className="size-4" />
                            Grades
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Grades by Subject
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            A read-only view of how your grade is computed
                            for each subject, including anything still
                            missing.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {subjects.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {subjects.map((subject) => (
                                    <Link
                                        key={subject.id}
                                        href={`/student/courses/${subject.id}/grades/prelims`}
                                        className="flex items-center justify-between gap-3 p-5 hover:bg-red-50/40"
                                    >
                                        <p className="truncate font-semibold text-slate-900">
                                            {subject.subject}
                                        </p>
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
                                    No subjects enrolled yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enroll in a subject to see your grades
                                    here.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
