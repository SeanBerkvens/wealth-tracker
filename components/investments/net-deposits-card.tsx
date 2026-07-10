interface NetDepositsCardProps {
  value: number;
  percent?: number;
}

export default function NetDepositsCard({ value, percent }: NetDepositsCardProps) {
  const positive = value >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover flex flex-col items-center justify-center h-full">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
        Net Deposits
      </p>
      <p className="text-5xl font-bold tracking-tight mt-2">
        ${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}