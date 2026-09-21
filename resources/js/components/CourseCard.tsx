import type { Courseware } from '@/types/courseware';
import ArrowIcon from './icons/ArrowIcon';
import BookIcon from './icons/BookIcon';
import UserIcon from './icons/UserIcon';

interface CourseCardProps {
    course: Courseware;
    onOpen: (course: Courseware) => void;
}

export default function CourseCard({ course, onOpen }: CourseCardProps) {
    const progress = Math.min(Math.max(course.progress ?? 0, 0), 100);

    return (
        <article className="group overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="relative min-h-40 overflow-hidden border-b border-red-200 bg-red-100 p-6 text-red-950">
                <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-red-200/50" />

                <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/40" />

                <div className="relative flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                        <BookIcon />
                    </div>

                    <span className="rounded-full border border-red-200 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-red-700 backdrop-blur-sm">
                        {course.code ?? 'COURSE'}
                    </span>
                </div>

                <h2 className="relative mt-6 text-xl leading-tight font-bold">
                    {course.subject}
                </h2>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-red-800/70">
                    <UserIcon />
                    <span>{course.professor}</span>
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 font-medium text-slate-700">
                    {course.module_title}
                </p>

                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">
                            Course progress
                        </span>

                        <span className="font-bold text-red-700">
                            {progress}%
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-red-200">
                        <div
                            className="h-full rounded-full bg-red-600 transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onOpen(course)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
                >
                    Continue learning
                    <ArrowIcon />
                </button>
            </div>
        </article>
    );
}
