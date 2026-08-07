"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp } from "lucide-react";

interface Holding {
  symbol: string;
  name: string;
  value: number;
}

interface TopHoldingsProps {
  holdings: Holding[];
  currency?: string;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function TopHoldings({ holdings, currency = "CAD" }: TopHoldingsProps) {
  const top5 = [...holdings]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            Top Holdings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your largest investment positions
          </p>
        </div>
        <EmptyState variant="compact" icon={TrendingUp} title="No holdings yet" description="Add an investment to compare your largest positions." className="h-[200px]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Top Holdings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your largest investment positions
        </p>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={top5}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--muted-foreground)"
              tickFormatter={(value) => `$${new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 0 }).format(value)}`}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              stroke="var(--muted-foreground)"
              tick={{ fontSize: 13 }}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--card-foreground)",
                borderRadius: "12px",
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Value"]}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {top5.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
