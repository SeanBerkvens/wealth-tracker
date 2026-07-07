"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const INTERVALS = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
  { label: "YTD", value: "YTD" },
];

export default function PortfolioHistoryChart() {
  const [interval, setInterval] = useState("1M");
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch(`/api/portfolio/history?interval=${interval}`);
        const result = await res.json();
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Failed to fetch portfolio history:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [interval]);

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Portfolio History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your portfolio value over time
          </p>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {INTERVALS.map((item) => (
            <button
              key={item.value}
              onClick={() => setInterval(item.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                interval === item.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[385px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

              <XAxis
                dataKey="date"
                stroke="var(--muted-foreground)"
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  if (interval === "1D") {
                    return d.toLocaleTimeString("default", {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                  }
                  return d.toLocaleDateString("default", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />

              <YAxis
                stroke="var(--muted-foreground)"
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  color: "var(--card-foreground)",
                  borderRadius: "12px",
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Value"]}
                labelFormatter={(label: any) => {
                  const d = new Date(label);
                  if (interval === "1D") {
                    return d.toLocaleString("default", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    });
                  }
                  return d.toLocaleDateString("default", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={3}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
