"use client";

import { useEffect, useState } from "react";
import TodayGainCard from "@/components/investments/today-gain-card";
import UnrealizedGainCard from "@/components/investments/unrealized-gain-card";
import NetDepositsCard from "@/components/investments/net-deposits-card";

type GainsData = {
  todayGainValue: number;
  todayGainPercent: number;
  unrealizedGainValue: number;
  unrealizedGainPercent: number;
  bookValue: number;
  netDeposits: number;
};

export default function PortfolioPerformance() {
  const [gains, setGains] = useState<GainsData | null>(null);

  useEffect(() => {
    async function fetchGains() {
      try {
        const res = await fetch("/api/portfolio/gains");
        const data = await res.json();
        setGains(data);
      } catch {
        setGains(null);
      }
    }
    fetchGains();
  }, []);

  if (!gains) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Portfolio Performance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your investment gains at a glance
        </p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <TodayGainCard
          value={gains.todayGainValue}
          percent={gains.todayGainPercent}
        />
        <UnrealizedGainCard
          value={gains.unrealizedGainValue}
          percent={gains.unrealizedGainPercent}
        />
        <NetDepositsCard
          value={gains.netDeposits}
        />
      </div>
    </div>
  );
}