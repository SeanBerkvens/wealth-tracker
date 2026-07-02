"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


const data = [
  {
    name: "Investments",
    value: 60,
  },
  {
    name: "Real Estate",
    value: 30,
  },
  {
    name: "Cash",
    value: 10,
  },
];


const COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
];


export function AssetAllocation() {
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
          Asset Allocation
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          How your wealth is distributed
        </p>

      </div>


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
                  fill={COLORS[index]}
                />
              ))}

            </Pie>


            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--card-foreground)",
              }}
              formatter={(value) =>
                `${value}%`
              }
            />

          </PieChart>

        </ResponsiveContainer>

      </div>


      {/* Breakdown */}
      <div className="mt-4 space-y-3">

        {data.map((item) => (

          <div
            key={item.name}
            className="
              flex
              items-center
              justify-between
              text-sm
            "
          >

            <span className="text-muted-foreground">
              {item.name}
            </span>


            <span className="font-medium text-card-foreground">
              {item.value}%
            </span>

          </div>

        ))}

      </div>


    </div>
  );
}