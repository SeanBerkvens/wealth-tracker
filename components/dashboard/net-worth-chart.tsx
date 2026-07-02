"use client";

import {
  LineChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


interface NetWorthChartProps {
  data: {
    date: string;
    value: number;
  }[];
}


export function NetWorthChart({
  data,
}: NetWorthChartProps) {
  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border
        p-6
        shadow-sm
      "
    >

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-xl font-semibold text-card-foreground">
          Net Worth Growth
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Your wealth progress over time
        </p>

      </div>


      {/* Chart */}
      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

  <AreaChart
    data={data.map((item) => ({
      month: new Date(item.date)
        .toLocaleString("default", {
          month: "short",
        }),
      value: item.value,
    }))}
  >

    <defs>
      <linearGradient
        id="wealthGradient"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="5%"
          stopColor="var(--primary)"
          stopOpacity={0.35}
        />

        <stop
          offset="95%"
          stopColor="var(--primary)"
          stopOpacity={0}
        />
      </linearGradient>
    </defs>


    <CartesianGrid
      strokeDasharray="3 3"
      stroke="var(--border)"
    />


    <XAxis
      dataKey="month"
      stroke="var(--muted-foreground)"
    />


    <YAxis
      stroke="var(--muted-foreground)"
      tickFormatter={(value) =>
        `$${value / 1000}k`
      }
    />


    <Tooltip
      contentStyle={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--card-foreground)",
        borderRadius: "12px",
      }}
      formatter={(value) =>
        `$${Number(value).toLocaleString()}`
      }
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