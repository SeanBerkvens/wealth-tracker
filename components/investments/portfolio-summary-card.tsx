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
      sum +
      Number(investment.shares) *
        Number(investment.purchase_price),
    0
  );

  const marketValue = investments.reduce(
    (sum, investment) =>
      sum + Number(investment.value),
    0
  );

  const gain = marketValue - bookValue;

  const gainPercent =
    bookValue > 0
      ? (gain / bookValue) * 100
      : 0;

  const gainPositive = gain >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">
        Portfolio Summary
      </h2>

      <div className="mt-6 space-y-5">

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Market Value
          </span>

          <span className="font-semibold">
            ${marketValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Book Value
          </span>

          <span className="font-semibold">
            ${bookValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Gain/Loss
          </span>

          <span
            className={`font-semibold ${
              gainPositive
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {gainPositive ? "+" : ""}
            ${gain.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}

            {" ("}

            {gainPositive ? "+" : ""}
            {gainPercent.toFixed(2)}%

            {")"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Holdings
          </span>

          <span className="font-semibold">
            {holdings}
          </span>
        </div>

      </div>
    </div>
  );
}