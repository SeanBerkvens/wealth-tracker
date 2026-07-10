"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AllocationItem {
  name: string;
  value: number;
}

interface AssetAllocationProps {
  data?: AllocationItem[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function AssetAllocation({ data = [] }: AssetAllocationProps) {
  const total = data.reduce((sum, item) => sum + Number(item.value), 0);

  const hasData = total > 0;

  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border
        p-6
        shadow-sm
        card-hover
      "
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Asset Allocation
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          How your wealth is distributed
        </p>
      </div>

      {!hasData ? (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
          No holdings to display
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="h-[250px]">
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
                      fill={COLORS[index % COLORS.length]}
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

          {/* Breakdown */}
          <div className="mt-4 space-y-3">
            {data.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
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
          </div>
        </>
      )}
    </div>
  );
}