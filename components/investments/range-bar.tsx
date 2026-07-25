"use client";

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
  positive?: boolean;
}

export default function RangeBar({ low, high, current, positive = true }: RangeBarProps) {
  const range = high - low || 1;
  const position = ((current - low) / range) * 100;

  const color = "var(--primary)";

  const barHeight = 6;
  const dotSize = 10;
  const barWidth = 120;

  return (
    <div className="inline-flex flex-col items-center gap-1" style={{ width: barWidth }}>
      {/* Labels */}
      <div className="flex w-full justify-between text-[10px] text-muted-foreground">
        <span>${low.toLocaleString()}</span>
        <span>${high.toLocaleString()}</span>
      </div>

      {/* Bar track + dot */}
      <div className="relative w-full" style={{ height: barHeight }}>
        {/* Background bar */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: "var(--border)",
            height: barHeight,
            overflow: "hidden",
          }}
        >
          {/* Filled portion */}
          <div
            className="h-full rounded-full"
            style={{
              width: `${position}%`,
              backgroundColor: color,
              opacity: 0.35,
            }}
          />
        </div>

        {/* Dot marker at current position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-sm"
          style={{
            left: `${position}%`,
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}