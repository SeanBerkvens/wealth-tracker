"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import AddPortfolioForm from "@/components/investments/add-portfolio-form";
import PriceRefresh from "@/components/investments/price-refresh";
import PortfolioValueCard from "@/components/investments/portfolio-value-card";
import PortfolioSummaryCard from "@/components/investments/portfolio-summary-card";
import PortfolioHistoryChart from "@/components/investments/portfolio-history-chart";
import AssetAllocationChart from "@/components/investments/asset-allocation-chart";
import InvestmentsTable from "@/components/investments/investments-table";
import TodayGainCard from "@/components/investments/today-gain-card";
import UnrealizedGainCard from "@/components/investments/unrealized-gain-card";

type Investment = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  value: number;
  purchase_date?: string;
  portfolio?: string;
};

type GainsData = {
  todayGainValue: number;
  todayGainPercent: number;
  unrealizedGainValue: number;
  unrealizedGainPercent: number;
  bookValue: number;
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [gains, setGains] = useState<GainsData | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    async function fetchInvestments() {
      const { data } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      setInvestments(data ?? []);
    }

    fetchInvestments();
  }, [refreshKey]);

  useEffect(() => {
    async function fetchGains() {
      try {
        const params = selectedPortfolio !== "all" ? `?portfolio=${encodeURIComponent(selectedPortfolio)}` : "";
        const res = await fetch(`/api/portfolio/gains${params}`);
        const data = await res.json();
        setGains(data);
      } catch {
        setGains(null);
      }
    }

    fetchGains();
  }, [refreshKey, selectedPortfolio]);

  // Filter investments by selected portfolio
  const filteredInvestments = useMemo(() => {
    if (selectedPortfolio === "all") return investments;
    return investments.filter((inv) => inv.portfolio === selectedPortfolio);
  }, [investments, selectedPortfolio]);

  const [portfolios, setPortfolios] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPortfolios() {
      const { data } = await supabase
        .from("portfolios")
        .select("name")
        .order("name", { ascending: true });

      setPortfolios((data ?? []).map((p: { name: string }) => p.name));
    }

    fetchPortfolios();
  }, [refreshKey]);

  const totalValue = filteredInvestments.reduce(
    (sum, inv) => sum + Number(inv.value),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Investments
          </h1>
          <p className="mt-1 text-muted-foreground text-lg">
            Track your portfolio holdings
          </p>
        </div>

        <PriceRefresh onRefresh={triggerRefresh} />
      </div>

      {/* Top Cards Row */}
      {gains && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <PortfolioValueCard
            value={totalValue}
            todayGainValue={gains.todayGainValue}
            todayGainPercent={gains.todayGainPercent}
            holdings={filteredInvestments.length}
            bookValue={gains.bookValue}
          />
          <UnrealizedGainCard
            value={gains.unrealizedGainValue}
            percent={gains.unrealizedGainPercent}
          />
          <TodayGainCard
            value={gains.todayGainValue}
            percent={gains.todayGainPercent}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-5 items-stretch">
        <div className="lg:col-span-3 flex flex-col">
          <PortfolioHistoryChart portfolio={selectedPortfolio !== "all" ? selectedPortfolio : undefined} />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <AssetAllocationChart investments={filteredInvestments} />
        </div>
      </div>

      {/* Holdings Section */}
      <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
        {/* Portfolio Tabs + Actions */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <div className="flex items-center gap-2">
            {/* Portfolio Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setSelectedPortfolio("all")}
                className={`px-3 py-1.5 text-sm rounded-md transition btn-press ${
                  selectedPortfolio === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {portfolios.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPortfolio(p)}
                  className={`px-3 py-1.5 text-sm rounded-md transition btn-press ${
                    selectedPortfolio === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-md border border-border bg-background text-foreground w-64"
            />

            <AddPortfolioForm onSuccess={triggerRefresh} />
            <AddInvestmentForm onSuccess={triggerRefresh} portfolios={portfolios} />
          </div>
        </div>

        <InvestmentsTable
          investments={filteredInvestments}
          searchQuery={searchQuery}
          onRefresh={triggerRefresh}
        />
      </div>
    </div>
  );
}