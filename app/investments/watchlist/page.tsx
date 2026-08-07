"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import InvestmentsTable from "@/components/investments/investments-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function WatchlistPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchInvestments() {
      const { data } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      setInvestments(data ?? []);
    }

    fetchInvestments();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Watchlist</h1>
          <p className="mt-1 text-muted-foreground text-lg">
            Monitor your tracked investments
          </p>
        </div>
      </div>

      {investments.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Keep an eye on the market"
          description="Your watchlist is for securities you are researching, separate from the investments included in your net worth. Search for a stock to begin exploring."
          primaryAction={<Button asChild><Link href="/investments/portfolios">Search stocks</Link></Button>}
        />
      ) : <>
      {/* Holdings Table */}
      <div className="rounded-2xl bg-card border border-border shadow-sm">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {investments.length} holding{investments.length !== 1 ? "s" : ""}
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
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <InvestmentsTable
            investments={investments}
            searchQuery={searchQuery}
            showPortfolio={true}
          />
        </div>
      </div>
      </>}
    </div>
  );
}
