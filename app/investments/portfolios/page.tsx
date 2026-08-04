"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import AddPortfolioForm from "@/components/investments/add-portfolio-form";
import PriceRefresh from "@/components/investments/price-refresh";
import PortfolioValueCard from "@/components/investments/portfolio-value-card";
import PortfolioHistoryChart from "@/components/investments/portfolio-history-chart";
import AssetAllocationChart from "@/components/investments/asset-allocation-chart";
import InvestmentsTable from "@/components/investments/investments-table";
import TodayGainCard from "@/components/investments/today-gain-card";
import UnrealizedGainCard from "@/components/investments/unrealized-gain-card";
import RealizedGainCard from "@/components/investments/realized-gain-card";
import NetDepositsCard from "@/components/investments/net-deposits-card";
import ImportInvestmentsCsv from "@/components/investments/import-investments-csv";
import { normalizeCurrency } from "@/lib/currency-format";

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
  currency?: string;
};

type GainsData = {
  todayGainValue: number;
  todayGainPercent: number;
  unrealizedGainValue: number;
  unrealizedGainPercent: number;
  bookValue: number;
  netDeposits: number;
  realizedGainValue: number;
  realizedGainPercent: number;
};

export default function PortfoliosPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [gains, setGains] = useState<GainsData | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const reportingCurrency = normalizeCurrency(user?.user_metadata?.preferred_currency);
  const [exchangeRates, setExchangeRates] = useState<Map<string, number>>(new Map([["CAD", 1]]));

  useEffect(() => {
    const sources = [...new Set(investments.map((investment) => investment.currency ?? "CAD"))];
    Promise.all(sources.map(async (from) => {
      if (from === reportingCurrency) return [from, 1] as const;
      const response = await fetch(`/api/exchange-rate?from=${from}&to=${reportingCurrency}`);
      const data = await response.json();
      return [from, Number(data.rate) || 1] as const;
    })).then((entries) => setExchangeRates(new Map(entries))).catch(() => setExchangeRates(new Map()));
  }, [investments, reportingCurrency]);

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

  const deleteAllHoldings = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/investments", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete holdings");
      setDeleteAllConfirmOpen(false);
      setSelectedPortfolio("all");
      triggerRefresh();
    } catch (error) {
      console.error("Error deleting all holdings:", error);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchInvestments() {
      if (!user) return;
      const { data } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setInvestments(data ?? []);
    }

    fetchInvestments();
  }, [refreshKey, user]);

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
  const openHoldingCount = filteredInvestments.filter((investment) => Number(investment.shares) > 0.00000001).length;
  const closedHoldingCount = filteredInvestments.length - openHoldingCount;

  const [portfolios, setPortfolios] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPortfolios() {
      if (!user) return;
      const { data } = await supabase
        .from("portfolios")
        .select("name")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      setPortfolios((data ?? []).map((p: { name: string }) => p.name));
    }

    fetchPortfolios();
  }, [refreshKey, user]);

  const totalValue = filteredInvestments.reduce(
    (sum, inv) => sum + Number(inv.value) * (exchangeRates.get(inv.currency ?? "CAD") ?? 1),
    0
  );
  const reportingInvestments = filteredInvestments.map((investment) => ({
    ...investment,
    value: Number(investment.value) * (exchangeRates.get(investment.currency ?? "CAD") ?? 1),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Portfolios
          </h1>
          <p className="mt-1 text-muted-foreground text-lg">
            Track your portfolio holdings
          </p>
        </div>

        <PriceRefresh onRefresh={triggerRefresh} />
      </div>

      {/* Top Cards Row */}
      {gains && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <PortfolioValueCard
            value={totalValue}
            todayGainValue={gains.todayGainValue}
            todayGainPercent={gains.todayGainPercent}
            holdings={filteredInvestments.length}
            bookValue={gains.bookValue}
            currency={reportingCurrency}
          />
          <NetDepositsCard
            value={gains.netDeposits}
            currency={reportingCurrency}
          />
          <UnrealizedGainCard
            value={gains.unrealizedGainValue}
            percent={gains.unrealizedGainPercent}
            currency={reportingCurrency}
          />
          <TodayGainCard
            value={gains.todayGainValue}
            percent={gains.todayGainPercent}
            currency={reportingCurrency}
          />
          <RealizedGainCard
            value={gains.realizedGainValue}
            percent={gains.realizedGainPercent}
            currency={reportingCurrency}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-5 items-stretch">
        <div className="lg:col-span-3 flex flex-col">
          <PortfolioHistoryChart portfolio={selectedPortfolio !== "all" ? selectedPortfolio : undefined} refreshKey={refreshKey} />
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <AssetAllocationChart investments={reportingInvestments} currency={reportingCurrency} />
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
                {openHoldingCount} open holding{openHoldingCount !== 1 ? "s" : ""} · {closedHoldingCount} closed holding{closedHoldingCount !== 1 ? "s" : ""}
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
              <ImportInvestmentsCsv portfolios={portfolios} onSuccess={triggerRefresh} />
              <AddInvestmentForm onSuccess={triggerRefresh} portfolios={portfolios} />
              {investments.length > 0 && <button type="button" onClick={() => setDeleteAllConfirmOpen(true)} className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/20 btn-press">Delete all holdings</button>}
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

      {deleteAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay">
          <div className="modal-content w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground">
            <h2 className="text-lg font-semibold">Delete all holdings?</h2>
            <p className="mt-3 text-sm text-muted-foreground">This permanently deletes all {investments.length} holdings and their linked transactions across every portfolio. This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteAllConfirmOpen(false)} disabled={deleting} className="rounded-lg bg-muted px-4 py-2 text-sm btn-press">Cancel</button>
              <button type="button" onClick={() => void deleteAllHoldings()} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 btn-press disabled:opacity-50">{deleting ? "Deleting..." : "Delete all"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
