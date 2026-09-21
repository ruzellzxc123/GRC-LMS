interface ScoreBarProps {
    value: number | null;
    label?: string;
}

export default function ScoreBar({ value, label }: ScoreBarProps) {
    if (value === null) {
        return <span className="text-xs text-slate-400">No data</span>;
    }

    const clamped = Math.max(0, Math.min(100, value));
    const color =
        clamped >= 70
            ? 'bg-emerald-500'
            : clamped >= 50
              ? 'bg-amber-500'
              : 'bg-red-500';

    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="text-xs font-medium text-slate-600">
                {label ?? `${Math.round(clamped)}%`}
            </span>
        </div>
    );
}
