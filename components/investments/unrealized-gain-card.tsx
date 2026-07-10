interface UnrealizedGainCardProps {
  value: number;
  percent: number;
}

export default function UnrealizedGainCard({
  value,
  percent,
}: UnrealizedGainCardProps) {
  const positive = value >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm card-hover">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Unrealized Gain
      </p>
      <p
        className={`text-4xl font-bold tracking-tight mt-1 ${
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {positive ? "+" : ""}$
        {value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
          }`}
        >
          {positive ? "+" : ""}
          {percent.toFixed(2)}%
        </span>
        <span className="text-xs text-muted-foreground">total return</span>
      </div>
    </div>
  );
}