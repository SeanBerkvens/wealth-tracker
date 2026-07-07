interface PortfolioValueCardProps {
  value: number;
  todayGainValue: number;
  todayGainPercent: number;
  holdings: number;
}

export default function PortfolioValueCard({
  value,
  todayGainValue,
  todayGainPercent,
  holdings,
}: PortfolioValueCardProps) {
  const positive = todayGainValue >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Portfolio Value
      </p>
      <p className="text-3xl font-bold tracking-tight mt-1">
        ${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
          }`}
        >
          {positive ? "+" : ""}$
          {todayGainValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="mx-1 opacity-50">|</span>
          {positive ? "+" : ""}
          {todayGainPercent.toFixed(2)}%
        </span>
        <span className="text-xs text-muted-foreground">today</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {holdings} holding{holdings !== 1 ? "s" : ""}
      </div>
    </div>
  );
}