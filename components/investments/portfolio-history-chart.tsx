"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartNoAxesCombined } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { formatCurrency, normalizeCurrency } from "@/lib/currency-format";

const INTERVALS = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "5Y", value: "5Y" },
  { label: "YTD", value: "YTD" },
  { label: "ALL", value: "ALL" },
];

const BENCHMARKS = [
  { value: "sp500", label: "S&P 500" },
  { value: "nasdaq100", label: "Nasdaq-100" },
  { value: "dowjones", label: "Dow Jones" },
  { value: "totalmarket", label: "Total Stock Market" },
];

export default function PortfolioHistoryChart({
  portfolio,
  refreshKey = 0,
}: {
  portfolio?: string;
  refreshKey?: number;
}) {
  const { user } = useAuth();
  const currency = normalizeCurrency(user?.user_metadata?.preferred_currency);
  const [interval, setInterval] = useState("1M");
  const [comparison, setComparison] = useState("");
  const [data, setData] = useState<{ date: string; value: number; bookValue: number; performanceValue?: number; benchmarkValue?: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // Format interval for display
  const getIntervalLabel = (interval: string): string => {
    const map: Record<string, string> = {
      '1D': '1 day',
      '1W': '1 week',
      '1M': '1 month',
      '3M': '3 months',
      '6M': '6 months',
      '1Y': '1 year',
      '5Y': '5 years',
      'YTD': 'year to date',
      'ALL': 'all time'
    };
    return map[interval] || interval.toLowerCase();
  };
  
  // Calculate change over the period
  const periodChange = useMemo(() => {
    if (data.length < 2) return null;
    const firstValue = comparison ? (data[0].performanceValue ?? 0) : data[0].value;
    const lastValue = comparison ? (data[data.length - 1].performanceValue ?? 0) : data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0;
    return { change, changePercent };
  }, [data, comparison]);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ interval });
        if (portfolio) params.set("portfolio", portfolio);
        if (comparison) params.set("benchmark", comparison);
        const res = await fetch(`/api/portfolio/history?${params.toString()}`);
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
  }, [interval, portfolio, comparison, refreshKey]);

  return (
    <div className="h-full min-h-[620px] rounded-2xl bg-card border border-border p-6 shadow-sm card-hover flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Portfolio History
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {comparison ? "Investment growth compared with the selected index" : "Your portfolio value over time"}
          </p>
          {periodChange && (
            <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${
              periodChange.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>
                {periodChange.change >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(periodChange.change), currency)}{' '}
                past {getIntervalLabel(interval)} →
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="relative">
            <span className="sr-only">Compare portfolio to market index</span>
            <select value={comparison} onChange={(event) => setComparison(event.target.value)} className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-muted py-1.5 pl-3 pr-8 text-sm font-medium text-foreground outline-none transition hover:border-primary focus:border-primary">
              <option value="">Compare</option>
              {BENCHMARKS.map((benchmark) => <option key={benchmark.value} value={benchmark.value}>{benchmark.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">⌄</span>
          </label>

          {/* Interval Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {INTERVALS.map((item) => (
            <button
              key={item.value}
              onClick={() => setInterval(item.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition btn-press ${
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
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : data.length < 2 ? (
          <EmptyState variant="compact" icon={ChartNoAxesCombined} title="More history is needed" description="Portfolio performance appears after transactions create at least two data points." className="h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis hide />

              <YAxis hide />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  color: "var(--card-foreground)",
                  borderRadius: "12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  const label = name === "bookValue" ? "Net Deposits" : name === "benchmarkValue" ? `${BENCHMARKS.find((benchmark) => benchmark.value === comparison)?.label ?? "Benchmark"} growth` : name === "performanceValue" ? "Investment growth" : "Value";
                  return [formatCurrency(Number(value), currency), label];
                }}
                labelFormatter={(label, payload) => {
                  // Extract date from payload when available
                  const dateStr = payload && payload.length > 0 && payload[0].payload ? 
                                  String(payload[0].payload.date) : 
                                  String(label);
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime()) || !dateStr || dateStr === 'undefined') {
                    return '';
                  }
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
                dataKey={comparison ? "performanceValue" : "value"}
                name={comparison ? "performanceValue" : "value"}
                stroke="var(--primary)"
                strokeWidth={3}
                fill="url(#portfolioGradient)"
              />
              {comparison && <Area type="monotone" dataKey="benchmarkValue" name="benchmarkValue" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 3" fill="none" connectNulls />}
              {!comparison && <Area
                type="monotone"
                dataKey="bookValue"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="url(#bookValueGradient)"
              />}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
