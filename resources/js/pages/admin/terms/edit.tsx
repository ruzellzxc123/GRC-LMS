import { Form, Head, Link } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lastDayOfWeek18 } from '@/lib/term-dates';

interface Term {
    id: number;
    name: string;
    semester: string | null;
    start_date: string;
    end_date: string;
    prelims_start: string | null;
    prelims_end: string | null;
    midterm_start: string | null;
    midterm_end: string | null;
    finals_start: string | null;
    finals_end: string | null;
}

interface EditTermProps {
    term: Term;
    semesters: string[];
}

export default function EditTerm({ term, semesters }: EditTermProps) {
    const [startDate, setStartDate] = useState(term.start_date);
    const [endDate, setEndDate] = useState(term.end_date);

    return (
        <>
            <Head title={`Edit ${term.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <BackLink
                        href="/admin/terms"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to terms
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <Save className="size-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Academic Term
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        Update academic term values.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/admin/terms/${term.id}`}
                            method="put"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Term Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={term.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="semester">
                                            Semester
                                        </Label>
                                        <select
                                            id="semester"
                                            name="semester"
                                            defaultValue={term.semester ?? ''}
                                            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                        >
                                            <option value="">Not set</option>
                                            {semesters.map((semester) => (
                                                <option
                                                    key={semester}
                                                    value={semester}
                                                >
                                                    {semester}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500">
                                            Used to match this term against a
                                            department's curriculum (First vs
                                            Second Semester subjects) when
                                            creating a subject.
                                        </p>
                                        <InputError message={errors.semester} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="start_date">
                                            Start Date
                                        </Label>
                                        <Input
                                            id="start_date"
                                            name="start_date"
                                            type="date"
                                            value={startDate}
                                            onChange={(event) => {
                                                setStartDate(
                                                    event.target.value,
                                                );
                                                setEndDate(
                                                    lastDayOfWeek18(
                                                        event.target.value,
                                                    ),
                                                );
                                            }}
                                            required
                                        />
                                        <InputError
                                            message={errors.start_date}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="end_date">
                                            End Date
                                        </Label>
                                        <Input
                                            id="end_date"
                                            name="end_date"
                                            type="date"
                                            value={endDate}
                                            onChange={(event) =>
                                                setEndDate(event.target.value)
                                            }
                                            required
                                        />
                                        <p className="text-xs text-slate-500">
                                            Auto-fills to the end of the 18th
                                            week when you change the start date
                                            — adjust if needed.
                                        </p>
                                        <InputError message={errors.end_date} />
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Exam Period Dates (optional)
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            These highlight on everyone's
                                            calendar (admin, professors, and
                                            students).
                                        </p>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="prelims_start">
                                                    Prelims Start
                                                </Label>
                                                <Input
                                                    id="prelims_start"
                                                    name="prelims_start"
                                                    type="date"
                                                    defaultValue={
                                                        term.prelims_start ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.prelims_start
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="prelims_end">
                                                    Prelims End
                                                </Label>
                                                <Input
                                                    id="prelims_end"
                                                    name="prelims_end"
                                                    type="date"
                                                    defaultValue={
                                                        term.prelims_end ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.prelims_end}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="midterm_start">
                                                    Midterm Start
                                                </Label>
                                                <Input
                                                    id="midterm_start"
                                                    name="midterm_start"
                                                    type="date"
                                                    defaultValue={
                                                        term.midterm_start ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.midterm_start
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="midterm_end">
                                                    Midterm End
                                                </Label>
                                                <Input
                                                    id="midterm_end"
                                                    name="midterm_end"
                                                    type="date"
                                                    defaultValue={
                                                        term.midterm_end ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.midterm_end}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="finals_start">
                                                    Finals Start
                                                </Label>
                                                <Input
                                                    id="finals_start"
                                                    name="finals_start"
                                                    type="date"
                                                    defaultValue={
                                                        term.finals_start ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.finals_start
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="finals_end">
                                                    Finals End
                                                </Label>
                                                <Input
                                                    id="finals_end"
                                                    name="finals_end"
                                                    type="date"
                                                    defaultValue={
                                                        term.finals_end ?? ''
                                                    }
                                                />
                                                <InputError
                                                    message={errors.finals_end}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href="/admin/terms"
                                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Link>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2 bg-red-600 text-white hover:bg-red-700"
                                        >
                                            <Save className="size-4" />
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
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
