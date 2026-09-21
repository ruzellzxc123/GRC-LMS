import { Form, Head, Link } from '@inertiajs/react';
import { Save } from 'lucide-react';
import BackLink from '@/components/back-link';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
}

interface EditDepartmentProps {
    department: Department;
}

export default function EditDepartment({ department }: EditDepartmentProps) {
    return (
        <>
            <Head title={`Edit ${department.name}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl">
                    <BackLink
                        href="/admin/departments"
                        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700"
                    >
                        Back to departments
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/15 p-3">
                                    <Save className="size-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Edit Department
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        Update department details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Form
                            action={`/admin/departments/${department.id}`}
                            method="put"
                            disableWhileProcessing
                            className="p-6"
                        >
                            {({ processing, errors }) => (
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            Department Name
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={department.name}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="code">
                                            Department Code
                                        </Label>
                                        <Input
                                            id="code"
                                            name="code"
                                            defaultValue={department.code}
                                            required
                                        />
                                        <InputError message={errors.code} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            defaultValue={
                                                department.description ?? ''
                                            }
                                            className="min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                        <Link
                                            href="/admin/departments"
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
