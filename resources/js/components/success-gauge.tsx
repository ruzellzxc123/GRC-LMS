interface SuccessGaugeProps {
    value: number;
    label?: string;
}

export default function SuccessGauge({
    value,
    label = 'success score',
}: SuccessGaugeProps) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, value));
    const offset = circumference * (1 - clamped / 100);

    const color =
        clamped >= 80
            ? '#059669'
            : clamped >= 60
              ? '#0284c7'
              : clamped >= 40
                ? '#d97706'
                : '#dc2626';

    return (
        <div className="relative flex size-32 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
                <circle
                    cx={60}
                    cy={60}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={10}
                />
                <circle
                    cx={60}
                    cy={60}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={10}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-900">
                    {clamped}%
                </span>
                <span className="text-xs text-slate-500">{label}</span>
            </div>
        </div>
    );
}
