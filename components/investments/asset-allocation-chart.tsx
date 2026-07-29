"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Investment {
  symbol: string;
  name: string;
  value: number;
}

interface AssetAllocationChartProps {
  investments: Investment[];
}

const BASE_COLORS = [
  "#22d3ee",
  "#fb923c",
  "#a78bfa",
  "#4ade80",
  "#f472b6",
  "#facc15",
];

function colorFor(index: number): string {
  if (index < BASE_COLORS.length) {
    return BASE_COLORS[index];
  }
  const hue = (index * 47) % 360;
  return `hsl(${hue} 60% 55%)`;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AssetAllocationChart({
  investments,
}: AssetAllocationChartProps) {
  const total = investments.reduce(
    (sum, investment) => sum + Number(investment.value),
    0
  );

  const data = investments
    .map((investment) => ({
      name: investment.symbol || investment.name,
      value: Number(investment.value),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-card-foreground">
          Asset Allocation
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Breakdown of each holding by value
        </p>
      </div>

      {data.length === 0 || total <= 0 ? (
        <div className="h-[541px] flex items-center justify-center text-muted-foreground text-sm">
          No holdings to display
        </div>
      ) : (
        <>
          {/* Donut + Horizontal Stacked Bar — 1:2 ratio */}
          <div className="grid h-[541px] grid-cols-[330px_360px] justify-center gap-6">
            {/* Donut */}
            <div>
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={100}
                      outerRadius={165}
                      paddingAngle={3}
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colorFor(index)}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--card-foreground)",
                      }}
                      formatter={(value, name) => {
                        const num = Number(value) || 0;
                        return [
                          `${formatCurrency(num)} (${(
                            (num / total) *
                            100
                          ).toFixed(1)}%)`,
                          String(name),
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Horizontal Stacked Bar — 2x width */}
            <div className="flex h-full flex-col justify-center">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Allocation by value
              </p>

              {/* Stacked bar */}
              <div className="flex h-5 w-full max-w-[360px] overflow-hidden rounded-full">
                {data.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: colorFor(index),
                    }}
                    title={`${item.name}: ${((item.value / total) * 100).toFixed(1)}%`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 max-w-[360px] space-y-2.5">
                {data.slice(0, 5).map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: colorFor(index) }}
                      />
                      {item.name}
                    </span>
                    <span className="grid grid-cols-[7rem_3.5rem] gap-2 text-right font-medium tabular-nums text-card-foreground">
                      <span>{formatCurrency(item.value)}</span>
                      <span className="text-muted-foreground">
                        {((item.value / total) * 100).toFixed(1)}%
                      </span>
                    </span>
                  </div>
                ))}
                {data.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{data.length - 5} more
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
