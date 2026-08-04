"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/currency-format";

interface PortfolioValueCardProps {
  value: number;
  todayGainValue: number;
  todayGainPercent: number;
  holdings: number;
  bookValue: number;
  currency?: string;
}

const ANIMATION_DURATION_MS = 500;

export default function PortfolioValueCard({ value, currency = "CAD" }: PortfolioValueCardProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const displayedValueRef = useRef(value);

  useEffect(() => {
    const startValue = displayedValueRef.current;
    if (startValue === value) return;

    let frameId = 0;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / ANIMATION_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (value - startValue) * easedProgress;

      displayedValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        displayedValueRef.current = value;
        setIsAnimating(false);
      }
    };

    frameId = requestAnimationFrame(() => {
      setIsAnimating(true);
      frameId = requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover flex flex-col items-center justify-center h-full">
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
        Portfolio Value
      </p>
      <p
        aria-live="polite"
        className={`mt-2 text-5xl font-bold tracking-tight transition-transform duration-300 ${
          isAnimating ? "scale-105" : "scale-100"
        }`}
      >
        {formatCurrency(displayValue, currency)}
      </p>
    </div>
  );
}
