interface TodayGainCardProps {
  value: number;
  percent: number;
}

export default function TodayGainCard({ value, percent }: TodayGainCardProps) {
  const positive = value >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover h-full">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-2">
        Today{"'"}s Gain
      </p>
      <div className="flex items-center justify-center gap-3">
        <p
          className={`text-5xl font-bold tracking-tight ${
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {positive ? "+" : ""}$
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
          }`}
        >
          {positive ? "+" : ""}
          {percent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}