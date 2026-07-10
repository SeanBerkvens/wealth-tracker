interface Investment {
  shares: number;
  purchase_price: number;
  value: number;
}

interface PortfolioSummaryCardProps {
  investments: Investment[];
}

export default function PortfolioSummaryCard({
  investments,
}: PortfolioSummaryCardProps) {
  const holdings = investments.length;

  const bookValue = investments.reduce(
    (sum, investment) =>
      sum + Number(investment.shares) * Number(investment.purchase_price),
    0
  );

  const marketValue = investments.reduce(
    (sum, investment) => sum + Number(investment.value),
    0
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm card-hover">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Portfolio Summary
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Market Value</span>
          <span className="font-semibold text-base">
            ${marketValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Book Value</span>
          <span className="text-base">
            ${bookValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Holdings</span>
          <span className="text-base font-semibold">{holdings}</span>
        </div>
      </div>
    </div>
  );
}