import { cn } from '@/lib/utils';

interface Series {
    name: string;
    color: string;
    data: number[];
}

interface BarChartProps {
    labels: string[];
    series: Series[];
    className?: string;
}

export function BarChart({ labels, series, className }: BarChartProps) {
    const max = Math.max(1, ...series.flatMap((s) => s.data));

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-end gap-4">
                {series.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.name}
                    </div>
                ))}
            </div>
            <div className="flex h-44 items-end gap-2">
                {labels.map((label, index) => (
                    <div key={`${label}-${index}`} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-full w-full items-end justify-center gap-1">
                            {series.map((s) => (
                                <div
                                    key={s.name}
                                    className="w-full max-w-3.5 rounded-t-sm"
                                    title={`${s.name}: ${s.data[index] ?? 0}`}
                                    style={{
                                        height: `${
                                            (s.data[index] ?? 0) > 0
                                                ? Math.max(((s.data[index] ?? 0) / max) * 100, 5)
                                                : 0
                                        }%`,
                                        background: s.color,
                                    }}
                                />
                            ))}
                        </div>
                        <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
