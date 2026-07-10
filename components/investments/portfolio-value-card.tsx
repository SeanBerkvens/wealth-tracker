interface PortfolioValueCardProps {
  value: number;
  todayGainValue: number;
  todayGainPercent: number;
  holdings: number;
  bookValue: number;
}

export default function PortfolioValueCard({
  value,
  todayGainValue,
  todayGainPercent,
  holdings,
  bookValue,
}: PortfolioValueCardProps) {
  const positive = bookValue >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
        Portfolio Value
      </p>
      <p className="text-5xl font-bold tracking-tight mt-2">
        ${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
            positive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
          }`}
        >
          Book Value: ${bookValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {holdings} holding{holdings !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
