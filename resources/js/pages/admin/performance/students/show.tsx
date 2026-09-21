import { Head } from '@inertiajs/react';
import { TrendingUp } from 'lucide-react';
import BackLink from '@/components/back-link';
import ScoreBar from '@/components/score-bar';

interface Student {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
}

interface Prediction {
    attendance_rate: number | null;
    quiz_average: number | null;
    profile_completeness: number;
    composite_score: number;
    label: string;
    flags: string[];
    risk_level: string;
}

interface CoursePrediction extends Prediction {
    courseware: { id: number; subject: string };
}

interface ShowPerformanceProps {
    student: Student;
    prediction: Prediction;
    courses: CoursePrediction[];
}

const FLAG_LABELS: Record<string, string> = {
    low_attendance: 'Low Attendance',
    low_quiz_performance: 'Low Quiz Performance',
    incomplete_profile: 'Incomplete Profile',
};

export default function ShowPerformance({
    student,
    prediction,
    courses,
}: ShowPerformanceProps) {
    return (
        <>
            <Head title={`Performance — ${student.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href="/admin/performance/students">
                        Back to performance
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <TrendingUp className="size-4" />
                            Performance Prediction
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {student.name}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            {student.student_id ?? student.email}
                        </p>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                Attendance
                            </p>
                            <div className="mt-3">
                                <ScoreBar value={prediction.attendance_rate} />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                Quiz Average
                            </p>
                            <div className="mt-3">
                                <ScoreBar value={prediction.quiz_average} />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                Profile Completeness
                            </p>
                            <div className="mt-3">
                                <ScoreBar
                                    value={prediction.profile_completeness}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Composite Score
                                </p>
                                <p className="mt-1 text-3xl font-bold text-slate-900">
                                    {prediction.composite_score}%
                                </p>
                            </div>
                            <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                                {prediction.label}
                            </span>
                        </div>

                        {prediction.flags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {prediction.flags.map((flag) => (
                                    <span
                                        key={flag}
                                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                                    >
                                        {FLAG_LABELS[flag] ?? flag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5">
                            <h2 className="font-semibold text-slate-900">
                                Per-Subject Breakdown
                            </h2>
                        </div>

                        {courses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">
                                                Subject
                                            </th>
                                            <th className="px-5 py-3 font-semibold">
                                                Attendance
                                            </th>
                                            <th className="px-5 py-3 font-semibold">
                                                Quiz Avg
                                            </th>
                                            <th className="px-5 py-3 font-semibold">
                                                Score
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {courses.map((course) => (
                                            <tr key={course.courseware.id}>
                                                <td className="px-5 py-4 font-medium text-slate-900">
                                                    {course.courseware.subject}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ScoreBar
                                                        value={
                                                            course.attendance_rate
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ScoreBar
                                                        value={
                                                            course.quiz_average
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                    {course.composite_score}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="p-6 text-center text-sm text-slate-500">
                                Not enrolled in any subject yet.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
