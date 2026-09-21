import { Head } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import BackLink from '@/components/back-link';
import type { QuestionState } from '@/components/quiz-builder-form';
import QuizBuilderForm from '@/components/quiz-builder-form';

interface Course {
    id: number;
    subject: string;
}

interface QuizDetail {
    id: number;
    courseware_id: number;
    title: string;
    description: string | null;
    deadline: string | null;
    term: string;
    timing_mode: 'timestamp' | 'timer';
    time_limit_minutes: number | null;
    questions_to_answer: number | null;
    is_published: boolean;
    has_attempts: boolean;
    questions: QuestionState[];
}

interface EditQuizProps {
    quiz: QuizDetail;
    courses: Course[];
    content_item_id?: number | null;
}

export default function EditQuiz({
    quiz,
    courses,
    content_item_id,
}: EditQuizProps) {
    return (
        <>
            <Head title={`Edit ${quiz.title}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <BackLink
                        href="/professor/quizzes"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to quizzes
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <Pencil className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Quiz
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        Update quiz details and questions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <QuizBuilderForm
                            courses={courses}
                            submitUrl={`/professor/quizzes/${quiz.id}`}
                            submitMethod="put"
                            submitLabel="Save Changes"
                            initialTitle={quiz.title}
                            initialDescription={quiz.description ?? ''}
                            initialDeadline={quiz.deadline ?? ''}
                            initialTerm={quiz.term}
                            initialCoursewareId={quiz.courseware_id}
                            initialQuestions={quiz.questions}
                            initialTimingMode={quiz.timing_mode}
                            initialTimeLimitMinutes={quiz.time_limit_minutes}
                            initialQuestionsToAnswer={quiz.questions_to_answer}
                            lockQuestions={quiz.has_attempts}
                            contentItemId={content_item_id ?? null}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
