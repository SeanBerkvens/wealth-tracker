"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
  { label: "ALL", value: "ALL" },
];

interface NetWorthChartProps {
  data: {
    date: string;
    value: number;
  }[];
}

function getFilterStartDate(interval: string): Date {
  const now = new Date();
  const copy = new Date(now);

  switch (interval) {
    case "1D":
      copy.setDate(copy.getDate() - 1);
      break;
    case "1W":
      copy.setDate(copy.getDate() - 7);
      break;
    case "1M":
      copy.setMonth(copy.getMonth() - 1);
      break;
    case "3M":
      copy.setMonth(copy.getMonth() - 3);
      break;
    case "6M":
      copy.setMonth(copy.getMonth() - 6);
      break;
    case "1Y":
      copy.setFullYear(copy.getFullYear() - 1);
      break;
    case "5Y":
      copy.setFullYear(copy.getFullYear() - 5);
      break;
    case "YTD":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }

  return copy;
}

function formatChangeLabel(interval: string) {
  switch (interval) {
    case "1D":
      return "day";
    case "1W":
      return "week";
    case "1M":
      return "month";
    case "3M":
      return "3 months";
    case "6M":
      return "6 months";
    case "1Y":
      return "year";
    case "5Y":
      return "5 years";
    case "YTD":
      return "year to date";
    default:
      return "all time";
  }
}

function formatXAxisLabel(dateString: string, interval: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  if (interval === "1D") {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (interval === "1W" || interval === "1M") {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    year: "numeric",
  });
}

export function NetWorthChart({ data }: NetWorthChartProps) {
  const [interval, setInterval] = useState("1M");

  const sortedData = useMemo(
    () =>
      [...data]
        .map((item) => ({
          ...item,
          parsedDate: new Date(item.date),
        }))
        .filter((item) => !Number.isNaN(item.parsedDate.getTime()))
        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()),
    [data]
  );

  const filteredData = useMemo(() => {
    if (interval === "ALL") return sortedData;
    const startDate = getFilterStartDate(interval);
    return sortedData.filter((item) => item.parsedDate >= startDate);
  }, [sortedData, interval]);

  const periodChange = useMemo(() => {
    if (filteredData.length < 2) return null;
    const firstValue = filteredData[0].value;
    const lastValue = filteredData[filteredData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    return { change, changePercent, label: formatChangeLabel(interval) };
  }, [filteredData, interval]);

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

      <div className="flex flex-col gap-6">
        <div>
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Net Worth Growth
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your wealth progress over time
            </p>
          </div>
          {periodChange && (
            <div
              className={`mt-3 text-sm font-medium flex flex-wrap items-center gap-2 ${
                periodChange.change >= 0 ? "text-green-600" : "text-rose-600"
              }`}
            >
              <span>
                {periodChange.change >= 0 ? "+" : "-"}
                ${Math.abs(periodChange.change).toLocaleString()} ({periodChange.changePercent.toFixed(2)}%)
              </span>
              <span className="text-muted-foreground">over the past {periodChange.label}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-muted rounded-lg p-1">
          {INTERVALS.map((item) => (
            <button
              key={item.value}
              type="button"
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

      <div className="h-75 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData.map((item) => ({
              ...item,
              dateLabel: formatXAxisLabel(item.date, interval),
            }))}
          >
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

            <XAxis dataKey="dateLabel" stroke="var(--muted-foreground)" />

            <YAxis
              stroke="var(--muted-foreground)"
              tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--card-foreground)",
                borderRadius: "12px",
              }}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
              labelFormatter={(label) => label}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={3}
              fill="url(#wealthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}