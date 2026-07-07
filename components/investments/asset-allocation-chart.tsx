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
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
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
        <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
          No holdings to display
        </div>
      ) : (
        <>
          {/* Donut + Horizontal Stacked Bar — 1:2 ratio */}
          <div className="grid gap-6 grid-cols-3 h-[400px]">
            {/* Donut */}
            <div className="col-span-1">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
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
            <div className="col-span-2 flex flex-col justify-center h-full">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Allocation by value
              </p>

              {/* Stacked bar */}
              <div className="h-5 w-full rounded-full overflow-hidden flex">
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
              <div className="mt-4 space-y-2.5">
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
                    <span className="font-medium text-card-foreground">
                      {formatCurrency(item.value)}
                      <span className="ml-2 text-muted-foreground">
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
