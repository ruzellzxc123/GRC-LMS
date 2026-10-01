import { Form, Head, Link, router } from '@inertiajs/react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import StudentPasswordChangeController from '@/actions/App/Http/Controllers/Student/StudentPasswordChangeController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import PasswordStrengthMeter from '@/components/password-strength-meter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
    passwordRules: string;
    pending: boolean;
    deadline: string;
};

function DeadlineNotice({ deadline }: { deadline: string }) {
    const date = new Date(deadline);
    // Captured once per mount via a lazy initializer rather than read
    // directly in the render body, which React's purity checks flag as an
    // impure call.
    const [now] = useState(() => Date.now());
    const isPast = date.getTime() < now;

    const label = new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);

    return (
        <p
            className={`text-sm ${isPast ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
        >
            {isPast
                ? `This was due by ${label} — please finish it now.`
                : `Please finish this by ${label}.`}
        </p>
    );
}

export default function ForcedPasswordChange({
    passwordRules,
    pending,
    deadline,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const codeInput = useRef<HTMLInputElement>(null);
    const [newPassword, setNewPassword] = useState('');
    const [resending, setResending] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const resendCode = () => {
        setResending(true);
        router.post(
            StudentPasswordChangeController.resendCode.url(),
            {},
            { preserveScroll: true, onFinish: () => setResending(false) },
        );
    };

    const cancelChange = () => {
        setCancelling(true);
        router.delete(StudentPasswordChangeController.cancelUpdate.url(), {
            preserveScroll: true,
            onFinish: () => setCancelling(false),
        });
    };

    return (
        <>
            <Head title="Set a new password" />

            <div className="space-y-6">
                <div className="flex items-center gap-2 text-red-700">
                    <ShieldCheck className="size-5" />
                    <p className="text-sm font-semibold">
                        Required before you continue
                    </p>
                </div>

                <DeadlineNotice deadline={deadline} />

                {pending ? (
                    <Form
                        {...StudentPasswordChangeController.confirmUpdate.form()}
                        resetOnError={['code']}
                        onError={() => codeInput.current?.focus()}
                        className="grid gap-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">
                                        Verification code
                                    </Label>
                                    <Input
                                        id="code"
                                        ref={codeInput}
                                        name="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={8}
                                        placeholder="8-digit code"
                                        autoFocus
                                        className="text-center text-lg tracking-[0.3em]"
                                    />
                                    <InputError message={errors.code} />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-red-600 text-white hover:bg-red-700"
                                >
                                    Confirm new password
                                </Button>

                                <div className="flex items-center justify-center gap-4">
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
                                        Use a different password
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                ) : (
                    <Form
                        {...StudentPasswordChangeController.requestUpdate.form()}
                        resetOnError={['password', 'password_confirmation']}
                        resetOnSuccess
                        onSuccess={() => setNewPassword('')}
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }
                        }}
                        className="grid gap-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        autoComplete="new-password"
                                        autoFocus
                                        placeholder="New password"
                                        passwordrules={passwordRules}
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                    />
                                    <PasswordStrengthMeter
                                        password={newPassword}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        placeholder="Confirm password"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    We'll email an 8-digit code to confirm this
                                    before it takes effect.
                                </p>

                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-red-600 text-white hover:bg-red-700"
                                >
                                    Save new password
                                </Button>
                            </>
                        )}
                    </Form>
                )}

                <div className="border-t border-slate-200 pt-4 text-center">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="size-4" />
                        Log out and sign in as someone else
                    </Link>
                </div>
            </div>
        </>
    );
}

ForcedPasswordChange.layout = {
    title: 'Set a new password',
    description:
        'For your security, you need to set your own password before continuing.',
};
