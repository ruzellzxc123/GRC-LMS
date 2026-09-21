import { Form, Head, router, usePage } from '@inertiajs/react';
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { programs } from '@/constants/program';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
type PageProps = {
    auth: Auth;
    errors: Record<string, string>;
    [key: string]: unknown;
};

function AvatarUpload({ auth }: { auth: Auth }) {
    const getInitials = useInitials();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setPreview(URL.createObjectURL(file));
        setProcessing(true);

        router.post(
            '/settings/avatar',
            { avatar: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setPreview(null);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            },
        );
    };

    const removeAvatar = () => {
        setProcessing(true);
        router.delete('/settings/avatar', {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 overflow-hidden rounded-full">
                <AvatarImage
                    src={preview ?? auth.user.avatar}
                    alt={auth.user.name}
                />
                <AvatarFallback className="rounded-full bg-neutral-200 text-lg text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(auth.user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={processing}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5"
                    >
                        <Camera className="size-4" />
                        {auth.user.avatar ? 'Change photo' : 'Upload photo'}
                    </Button>
                    {auth.user.avatar && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={processing}
                            onClick={removeAvatar}
                            className="gap-1.5 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="size-4" />
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WEBP. Max 5MB.
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}

export default function Profile() {
    const { auth, errors } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <div className="grid gap-2">
                    <Label>Profile Picture</Label>
                    <AvatarUpload auth={auth} />
                    {errors.avatar && (
                        <p className="text-sm text-red-600">{errors.avatar}</p>
                    )}
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {auth.user.role === 'student' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="student_id">
                                            Student ID
                                        </Label>

                                        <Input
                                            id="student_id"
                                            type="text"
                                            defaultValue={
                                                auth.user.student_id ?? ''
                                            }
                                            disabled
                                            className="disabled:opacity-100"
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            Student IDs are permanent and can't
                                            be changed.
                                        </p>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="birthday">Birthday</Label>

                                    <Input
                                        id="birthday"
                                        name="birthday"
                                        type="date"
                                        defaultValue={auth.user.birthday ?? ''}
                                        required
                                    />

                                    <InputError message={errors.birthday} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="year_level">
                                        Year level
                                    </Label>

                                    <select
                                        id="year_level"
                                        name="year_level"
                                        defaultValue={
                                            auth.user.year_level ?? ''
                                        }
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="" disabled>
                                            Select year level
                                        </option>

                                        <option value="1st Year">
                                            1st Year
                                        </option>

                                        <option value="2nd Year">
                                            2nd Year
                                        </option>

                                        <option value="3rd Year">
                                            3rd Year
                                        </option>

                                        <option value="4th Year">
                                            4th Year
                                        </option>
                                    </select>

                                    <InputError message={errors.year_level} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="section">Section</Label>

                                    <Input
                                        id="section"
                                        name="section"
                                        type="text"
                                        defaultValue={auth.user.section ?? ''}
                                        required
                                        placeholder="BSIT-1A"
                                    />

                                    <InputError message={errors.section} />
                                </div>

                                <div className="grid gap-2 md:col-span-2">
                                    <Label htmlFor="program">Program</Label>

                                    <select
                                        id="program"
                                        name="program"
                                        required
                                        defaultValue={auth.user.program ?? ''}
                                        className="border-black-200 flex h-9 w-full rounded-md border px-3 py-1 text-sm text-slate-900 shadow-xs transition outline-none focus:border-red-500 focus:ring-3 focus:ring-red-200"
                                    >
                                        <option value="" disabled>
                                            Select program
                                        </option>

                                        {programs.map((program) => (
                                            <option
                                                key={program}
                                                value={program}
                                            >
                                                {program}
                                            </option>
                                        ))}
                                    </select>

                                    <InputError message={errors.program} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
