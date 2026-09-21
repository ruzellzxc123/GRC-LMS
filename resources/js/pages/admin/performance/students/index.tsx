import { Head, Link, router } from '@inertiajs/react';
import { Search, TrendingUp, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import ScoreBar from '@/components/score-bar';

interface Prediction {
    student: {
        id: number;
        name: string;
        email: string;
        student_id: string | null;
    };
    attendance_rate: number | null;
    quiz_average: number | null;
    composite_score: number;
    label: string;
    risk_level: string;
}

interface PerformanceStudentsProps {
    predictions: Prediction[];
    filters: {
        search: string;
    };
}

const RISK_BADGE: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700',
};

export default function PerformanceStudents({
    predictions,
    filters,
}: PerformanceStudentsProps) {
    const [search, setSearch] = useState(filters.search ?? '');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/admin/performance/students',
            { search },
            { preserveState: true, replace: true },
        );
    };

    const clearSearch = () => {
        setSearch('');
        router.get(
            '/admin/performance/students',
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Student Performance" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1500px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <TrendingUp className="size-4" />
                            Performance Prediction
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Student Performance
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Predicted standing based on attendance, quiz scores,
                            and profile completeness.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
                            <h2 className="font-semibold text-slate-900">
                                {predictions.length} students
                            </h2>
                            <form
                                onSubmit={submitSearch}
                                className="flex w-full gap-2 md:max-w-md"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search students..."
                                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-10 pl-10 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                    />
                                    {search !== '' && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
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

                        {predictions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left">
                                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3 font-semibold">
                                                Student
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
                                            <th className="px-5 py-3 font-semibold">
                                                Standing
                                            </th>
                                            <th className="px-5 py-3 text-right font-semibold">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {predictions.map((prediction) => (
                                            <tr
                                                key={prediction.student.id}
                                                className="hover:bg-red-50/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            prediction.student
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {prediction.student
                                                            .student_id ??
                                                            prediction.student
                                                                .email}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ScoreBar
                                                        value={
                                                            prediction.attendance_rate
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <ScoreBar
                                                        value={
                                                            prediction.quiz_average
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                    {prediction.composite_score}
                                                    %
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_BADGE[prediction.risk_level]}`}
                                                    >
                                                        {prediction.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        href={`/admin/performance/students/${prediction.student.id}`}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <TrendingUp className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No students found
                                </h3>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
