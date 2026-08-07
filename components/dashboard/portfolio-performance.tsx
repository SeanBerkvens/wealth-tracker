"use client";

import { useEffect, useState } from "react";
import TodayGainCard from "@/components/investments/today-gain-card";
import UnrealizedGainCard from "@/components/investments/unrealized-gain-card";
import NetDepositsCard from "@/components/investments/net-deposits-card";
import { useAuth } from "@/components/auth/auth-provider";
import { normalizeCurrency } from "@/lib/currency-format";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartNoAxesCombined } from "lucide-react";

type GainsData = {
  todayGainValue: number;
  todayGainPercent: number;
  unrealizedGainValue: number;
  unrealizedGainPercent: number;
  bookValue: number;
  netDeposits: number;
};

export default function PortfolioPerformance({ hasInvestments = true }: { hasInvestments?: boolean }) {
  const { user } = useAuth();
  const currency = normalizeCurrency(user?.user_metadata?.preferred_currency);
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

  if (!hasInvestments) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
        <div className="mb-6"><h2 className="text-xl font-semibold text-card-foreground">Portfolio Performance</h2><p className="mt-1 text-sm text-muted-foreground">Your investment gains at a glance</p></div>
        <EmptyState variant="compact" icon={ChartNoAxesCombined} title="Performance starts with a holding" description="Add investments and their transactions to follow gains over time." />
      </div>
    );
  }

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
          currency={currency}
        />
        <UnrealizedGainCard
          value={gains.unrealizedGainValue}
          percent={gains.unrealizedGainPercent}
          currency={currency}
        />
        <NetDepositsCard
          value={gains.netDeposits}
          currency={currency}
        />
      </div>
    </div>
  );
}
