"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import AddPortfolioForm from "@/components/investments/add-portfolio-form";
import PriceRefresh from "@/components/investments/price-refresh";
import PortfolioValueCard from "@/components/investments/portfolio-value-card";
import PortfolioHistoryChart from "@/components/investments/portfolio-history-chart";
import AssetAllocationChart from "@/components/investments/asset-allocation-chart";
import InvestmentsTable from "@/components/investments/investments-table";
import TodayGainCard from "@/components/investments/today-gain-card";
import UnrealizedGainCard from "@/components/investments/unrealized-gain-card";
import NetDepositsCard from "@/components/investments/net-deposits-card";

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
  netDeposits: number;
};

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [gains, setGains] = useState<GainsData | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDeletePortfolio = async () => {
    if (!portfolioToDelete || deleting) return;

    setDeleting(true);

    try {
      const res = await fetch("/api/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: portfolioToDelete }),
      });

      if (!res.ok) {
        console.error("Failed to delete portfolio");
        return;
      }

      // If we deleted the currently selected portfolio, switch to "all"
      if (selectedPortfolio === portfolioToDelete) {
        setSelectedPortfolio("all");
      }

      triggerRefresh();
      setDeleteConfirmOpen(false);
      setPortfolioToDelete(null);
    } catch (error) {
      console.error("Error deleting portfolio:", error);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (portfolioName: string) => {
    setPortfolioToDelete(portfolioName);
    setDeleteConfirmOpen(true);
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
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <PortfolioValueCard
            value={totalValue}
            todayGainValue={gains.todayGainValue}
            todayGainPercent={gains.todayGainPercent}
            holdings={filteredInvestments.length}
            bookValue={gains.bookValue}
          />
          <NetDepositsCard
            value={gains.netDeposits}
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
      <div className="rounded-2xl bg-card border border-border shadow-sm">
        <div className="p-5">
          {/* Portfolio Tabs + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  <div key={p} className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedPortfolio(p)}
                      className={`px-3 py-1.5 text-sm rounded-md transition btn-press ${
                        selectedPortfolio === p
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(p)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition text-xs"
                      title="Delete portfolio"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredInvestments.length} holding{filteredInvestments.length !== 1 ? "s" : ""}
              </span>
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
        </div>

        <div className="px-5 pb-5">
          <InvestmentsTable
            investments={filteredInvestments}
            searchQuery={searchQuery}
            onRefresh={triggerRefresh}
            showPortfolio={selectedPortfolio === "all"}
            portfolios={portfolios}
          />
        </div>
      </div>

      {/* Delete Portfolio Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 modal-overlay">
          <div className="w-full max-w-md p-6 rounded-xl bg-card text-card-foreground border border-border relative modal-content">
            <h2 className="text-lg font-semibold mb-4">Delete Portfolio</h2>
            
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this portfolio? All investments in this portfolio will also be deleted.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setPortfolioToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition btn-press disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={handleDeletePortfolio}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition btn-press disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
