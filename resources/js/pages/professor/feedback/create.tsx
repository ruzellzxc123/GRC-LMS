import { Form, Head, Link } from '@inertiajs/react';
import { MessageSquarePlus } from 'lucide-react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Courseware {
    id: number;
    subject: string;
}

interface Student {
    id: number;
    name: string;
}

interface CreateFeedbackProps {
    courseware: Courseware;
    student: Student;
}

export default function CreateFeedback({
    courseware,
    student,
}: CreateFeedbackProps) {
    return (
        <>
            <Head title={`Feedback for ${student.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-2xl">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/roster`}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to roster
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <MessageSquarePlus className="size-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Send Feedback
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        To {student.name} — {courseware.subject}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/professor/courses/${courseware.id}/students/${student.id}/feedback`}
                            method="post"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            required
                                            autoFocus
                                            rows={6}
                                            placeholder="Write feedback for this student..."
                                        />
                                        <InputError message={errors.message} />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href={`/professor/courses/${courseware.id}/roster`}
                                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Link>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                        >
                                            <MessageSquarePlus className="size-4" />
                                            {processing
                                                ? 'Sending...'
                                                : 'Send Feedback'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}
