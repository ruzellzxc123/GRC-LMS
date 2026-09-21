import { Head, Link } from '@inertiajs/react';
import { ClipboardList, UploadCloud } from 'lucide-react';
import BackLink from '@/components/back-link';
import QuizBuilderForm from '@/components/quiz-builder-form';

interface Course {
    id: number;
    subject: string;
}

interface ModuleOption {
    id: number;
    title: string;
    subject: string;
    term: string;
    courseware_id: number;
}

interface CreateQuizProps {
    courses: Course[];
    content_item_id?: string | null;
    courseware_id?: string | null;
    locked_term?: string | null;
    available_modules?: ModuleOption[];
}

export default function CreateQuiz({
    courses,
    content_item_id,
    courseware_id,
    locked_term,
    available_modules,
}: CreateQuizProps) {
    const contentItemId = content_item_id ? Number(content_item_id) : null;
    const importHref = contentItemId
        ? `/professor/quizzes/import?content_item_id=${content_item_id}&courseware_id=${courseware_id ?? ''}`
        : '/professor/quizzes/import';

    return (
        <>
            <Head title="New Quiz" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <BackLink href="/professor/quizzes">
                            Back to quizzes
                        </BackLink>
                        <Link
                            href={importHref}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800"
                        >
                            <UploadCloud className="size-4" />
                            Import from file instead
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        New Quiz
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        {contentItemId
                                            ? "Build this module's quiz with multiple-choice questions."
                                            : 'Build a quiz with multiple-choice questions, or import one from a file.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <QuizBuilderForm
                            courses={courses}
                            submitUrl="/professor/quizzes"
                            submitMethod="post"
                            submitLabel="Create Quiz"
                            initialCoursewareId={
                                courseware_id ? Number(courseware_id) : null
                            }
                            initialTerm={locked_term ?? undefined}
                            contentItemId={contentItemId}
                            availableModules={available_modules ?? []}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
