import { Head } from '@inertiajs/react';
import { Award } from 'lucide-react';
import ScoreBar from '@/components/score-bar';

interface QuizScore {
    title: string;
    score: number;
    submitted_at: string;
}

interface SubjectScores {
    courseware_id: number;
    subject: string;
    average_score: number | null;
    quizzes: QuizScore[];
}

interface ScoresIndexProps {
    subjects: SubjectScores[];
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function ScoresIndex({ subjects }: ScoresIndexProps) {
    return (
        <>
            <Head title="Scores" />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Award className="size-4" />
                            Scores
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">My Scores</h1>
                        <p className="mt-2 text-sm text-red-100">
                            Your quiz scores per subject, sorted alphabetically.
                        </p>
                    </section>

                    {subjects.length > 0 ? (
                        <div className="space-y-6">
                            {subjects.map((subject) => (
                                <section
                                    key={subject.courseware_id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                        <h2 className="font-semibold text-slate-900">
                                            {subject.subject}
                                        </h2>
                                        <ScoreBar
                                            value={subject.average_score}
                                        />
                                    </div>

                                    {subject.quizzes.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[500px] text-left">
                                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Quiz
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Score
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Submitted
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {subject.quizzes.map(
                                                        (quiz, index) => (
                                                            <tr key={index}>
                                                                <td className="px-5 py-3 text-sm font-medium text-slate-900">
                                                                    {quiz.title}
                                                                </td>
                                                                <td className="px-5 py-3 text-sm text-slate-600">
                                                                    {quiz.score}
                                                                    %
                                                                </td>
                                                                <td className="px-5 py-3 text-sm text-slate-600">
                                                                    {formatDate(
                                                                        quiz.submitted_at,
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="px-5 py-6 text-center text-sm text-slate-500">
                                            No quiz attempts yet.
                                        </p>
                                    )}
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <Award className="mx-auto size-10 text-slate-300" />
                            <h3 className="mt-3 font-semibold text-slate-700">
                                No subjects yet
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Enroll in a subject to see scores here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
