const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];

const BAR_COLORS = [
    'bg-red-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
];

const TEXT_COLORS = [
    'text-red-600',
    'text-red-600',
    'text-amber-600',
    'text-yellow-600',
    'text-lime-600',
    'text-emerald-600',
];

function scorePassword(password: string): number {
    let score = 0;

    if (password.length >= 12) {
        score++;
    }

    if (password.length >= 16) {
        score++;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }

    return score;
}

export default function PasswordStrengthMeter({
    password,
}: {
    password: string;
}) {
    if (password === '') {
        return null;
    }

    const score = scorePassword(password);

    return (
        <div className="space-y-1">
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            index < score ? BAR_COLORS[score] : 'bg-muted'
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${TEXT_COLORS[score]}`}>
                {LABELS[score]}
            </p>
        </div>
    );
}
