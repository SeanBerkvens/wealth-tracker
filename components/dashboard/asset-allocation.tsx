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


export function AssetAllocation() {
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
          Asset Allocation
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
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
                <Cell key={`cell-${index}`} />
              ))}

            </Pie>


            <Tooltip
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

            <span className="text-neutral-600">
              {item.name}
            </span>


            <span className="font-medium">
              {item.value}%
            </span>

          </div>

        ))}

      </div>


    </div>
  );
}