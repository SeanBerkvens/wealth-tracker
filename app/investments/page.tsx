"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import PriceRefresh from "@/components/investments/price-refresh";
import PortfolioSummaryCard from "@/components/investments/portfolio-summary-card";
import PortfolioHistoryChart from "@/components/investments/portfolio-history-chart";
import InvestmentsTable from "@/components/investments/investments-table";

type Investment = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  value: number;
  purchase_date?: string;
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Investments
          </h1>

          <p className="mt-2 text-muted-foreground text-lg">
            Track your portfolio holdings
          </p>
        </div>

        <PriceRefresh onRefresh={triggerRefresh} />
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummaryCard investments={investments} />

      {/* Portfolio History Chart */}
      <PortfolioHistoryChart />

      {/* Holdings Section */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm overflow-x-auto">

        {/* Header Row with search + add button */}
        <div className="flex items-center justify-between mb-6 gap-4">

          <h2 className="text-xl font-semibold">
            Holdings
          </h2>

          <div className="flex items-center gap-3">

            {/* 🔍 Search */}
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                px-3 py-2 rounded-md
                border border-border
                bg-background text-foreground
                w-64
              "
            />

            {/* ➕ Add Button */}
            <AddInvestmentForm onSuccess={triggerRefresh} />

          </div>
        </div>

        {/* TABLE */}
        <InvestmentsTable
          investments={investments}
          searchQuery={searchQuery}
          onRefresh={triggerRefresh}
        />

      </div>

    </div>
  );
}
