import { Form, Head, router, usePage } from '@inertiajs/react';
import { Camera, Mail, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import EmailChangeController from '@/actions/App/Http/Controllers/Settings/EmailChangeController';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

type EmailChangeStage = 'none' | 'confirm-old' | 'confirm-new';

type PageProps = {
    auth: Auth;
    errors: Record<string, string>;
    emailChangeStage: EmailChangeStage;
    emailChangePendingEmail: string | null;
    [key: string]: unknown;
};

function ChangeEmail({
    currentEmail,
    stage,
    pendingEmail,
}: {
    currentEmail: string;
    stage: EmailChangeStage;
    pendingEmail: string | null;
}) {
    const codeInput = useRef<HTMLInputElement>(null);
    const [resending, setResending] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const resendCode = () => {
        setResending(true);
        router.post(
            EmailChangeController.resendCode.url(),
            {},
            { preserveScroll: true, onFinish: () => setResending(false) },
        );
    };

    const cancelChange = () => {
        setCancelling(true);
        router.delete(EmailChangeController.cancelUpdate.url(), {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
        });
    };

    return (
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
                <Mail className="size-4 text-red-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                    Change email
                </h3>
            </div>

            {stage === 'none' && (
                <Form
                    {...EmailChangeController.requestUpdate.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    className="grid gap-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <Label htmlFor="new_email">New email address</Label>
                            <Input
                                id="new_email"
                                type="email"
                                name="email"
                                placeholder="New email address"
                                autoComplete="email"
                            />
                            <InputError message={errors.email} />
                            <div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="sm"
                                >
                                    Send verification code
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}

            {stage === 'confirm-old' && (
                <Form
                    {...EmailChangeController.confirmOld.form()}
                    options={{ preserveScroll: true }}
                    resetOnError={['code']}
                    onError={() => codeInput.current?.focus()}
                    className="grid gap-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Enter the code we emailed to your current
                                address ({currentEmail}) to confirm this
                                request.
                            </p>
                            <Label htmlFor="old_code">Verification code</Label>
                            <Input
                                id="old_code"
                                ref={codeInput}
                                name="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={8}
                                placeholder="8-digit code"
                                className="max-w-xs text-center text-lg tracking-[0.3em]"
                            />
                            <InputError message={errors.code} />
                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="sm"
                                >
                                    Confirm
                                </Button>
                                <button
                                    type="button"
                                    onClick={resendCode}
                                    disabled={resending}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                >
                                    {resending ? 'Sending…' : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelChange}
                                    disabled={cancelling}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            )}

            {stage === 'confirm-new' && (
                <Form
                    {...EmailChangeController.confirmNew.form()}
                    options={{ preserveScroll: true }}
                    resetOnError={['code']}
                    onError={() => codeInput.current?.focus()}
                    className="grid gap-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Enter the code we emailed to{' '}
                                {pendingEmail ?? 'your new address'} to finish
                                confirming it.
                            </p>
                            <Label htmlFor="new_code">Verification code</Label>
                            <Input
                                id="new_code"
                                ref={codeInput}
                                name="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={8}
                                placeholder="8-digit code"
                                className="max-w-xs text-center text-lg tracking-[0.3em]"
                            />
                            <InputError message={errors.code} />
                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    size="sm"
                                >
                                    Confirm
                                </Button>
                                <button
                                    type="button"
                                    onClick={resendCode}
                                    disabled={resending}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                >
                                    {resending ? 'Sending…' : 'Resend code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelChange}
                                    disabled={cancelling}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            )}
        </div>
    );
}

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
    const { auth, errors, emailChangeStage, emailChangePendingEmail } =
        usePage<PageProps>().props;

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
                                    className="mt-1 block w-full disabled:opacity-100"
                                    defaultValue={auth.user.email}
                                    disabled
                                    autoComplete="username"
                                />

                                <p className="text-xs text-muted-foreground">
                                    Use "Change email" below to update this — it
                                    takes a verification code to your current
                                    and new address.
                                </p>
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

                <ChangeEmail
                    currentEmail={auth.user.email}
                    stage={emailChangeStage}
                    pendingEmail={emailChangePendingEmail}
                />
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
