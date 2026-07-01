"use client";

import {
  LineChart,
  Line,
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
        bg-white
        p-6
        shadow-sm
      "
    >

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Net Worth Growth
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Your wealth progress over time
        </p>

      </div>


      {/* Chart */}
      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
  data={data.map((item) => ({
    month: new Date(item.date)
      .toLocaleString("default", {
        month: "short",
      }),
    value: item.value,
  }))}
>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="month"
            />

            <YAxis
              tickFormatter={(value) =>
                `$${value / 1000}k`
              }
            />

            <Tooltip
              formatter={(value) =>
                `$${Number(value).toLocaleString()}`
              }
            />

            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={3}
              dot={false}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}