import { Head } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import BackLink from '@/components/back-link';
import Register from '@/pages/auth/register';

interface CreateStudentProps {
    passwordRules?: string;
    adminMode?: boolean;
    accountType?: 'student' | 'professor';
    studentIdPrefix: string;
}

export default function CreateStudent({
    passwordRules,
    studentIdPrefix,
}: CreateStudentProps) {
    return (
        <>
            <Head title="Add Student" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <BackLink
                        href="/admin/students"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-red-700"
                    >
                        Back to students
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <UserPlus className="size-6" />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Add Student
                                    </h1>

                                    <p className="mt-1 text-sm text-red-100">
                                        Create a new student LMS account
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <Register
                                passwordRules={passwordRules}
                                studentIdPrefix={studentIdPrefix}
                                adminMode
                                accountType="student"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
