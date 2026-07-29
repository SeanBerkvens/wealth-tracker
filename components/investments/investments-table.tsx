"use client";

import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import InvestmentActions from "@/components/investments/investment-actions";
import HoldingTransactions from "@/components/investments/holding-transactions";
import Sparkline from "@/components/investments/sparkline";
import RangeBar from "@/components/investments/range-bar";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Plus } from "lucide-react";

type Investment = {
  id: string;
  symbol: string;
  name: string;
  shares: number | string;
  purchase_price: number | string;
  current_price: number | string;
  purchase_date?: string;
  portfolio?: string;
};

type SortKey =
  | "portfolio"
  | "symbol"
  | "name"
  | "day"
  | "dayRange"
  | "week52Range"
  | "shares"
  | "last"
  | "avg"
  | "book"
  | "market"
  | "gain"
  | "gainPct";

type EnrichedInvestment = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avg: number;
  current: number;
  book: number;
  market: number;
  gain: number;
  gainPct: number;
  positive: boolean;
  purchase_date?: string;
  portfolio?: string;
};

type StockDetail = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  week52Low: number;
  week52High: number;
  sparkline: number[];
  positive: boolean;
};

function SortHeader({
  label,
  keyName,
  sortKey,
  sortDir,
  onToggle,
}: {
  label: string;
  keyName: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  const active = sortKey === keyName;

  return (
    <button
      type="button"
      onClick={() => onToggle(keyName)}
      aria-label={`Sort by ${label}`}
      className={`inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-base font-semibold transition-colors ${
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      {active && <span className="text-xs leading-none">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

export default function InvestmentsTable({
  investments = [],
  searchQuery = "",
  onRefresh,
  showPortfolio = false,
  portfolios = [],
}: {
  investments?: Investment[];
  searchQuery?: string;
  onRefresh?: () => void;
  showPortfolio?: boolean;
  portfolios?: string[];
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useMemo(() => createClient(), []);
  const [sortKey, setSortKey] = useState<SortKey>("market");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [stockDetails, setStockDetails] = useState<Map<string, StockDetail>>(new Map());
  const [logos, setLogos] = useState<Map<string, string>>(new Map());
  const [expandedInvestmentId, setExpandedInvestmentId] = useState<string | null>(null);
  const [holdingIdsWithTransactions, setHoldingIdsWithTransactions] = useState<Set<string>>(new Set());
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const investmentIds = (investments ?? []).map((investment) => investment.id);
    if (!userId || investmentIds.length === 0) {
      void Promise.resolve().then(() => setHoldingIdsWithTransactions(new Set()));
      return;
    }

    const loadTransactionHoldingIds = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("investment_id")
        .eq("user_id", userId)
        .in("investment_id", investmentIds);

      setHoldingIdsWithTransactions(
        new Set((data ?? []).flatMap((transaction) => transaction.investment_id ? [transaction.investment_id] : []))
      );
    };

    void loadTransactionHoldingIds();
  }, [investments, supabase, userId]);

  const enriched = useMemo(() => {
    return (investments ?? []).map((inv) => {
      const shares = Number(inv.shares);
      const avg = Number(inv.purchase_price);
      const current = Number(inv.current_price);

      const book = shares * avg;
      const market = shares * current;
      const gain = market - book;
      const gainPct = book !== 0 ? (gain / book) * 100 : 0;

      return {
        id: inv.id,
        symbol: inv.symbol,
        name: inv.name,
        shares,
        avg,
        current,
        book,
        market,
        gain,
        gainPct,
        positive: gain >= 0,
        purchase_date: inv.purchase_date,
        portfolio: inv.portfolio,
      };
    });
  }, [investments]);

  useEffect(() => {
    const symbols = [...new Set((investments ?? []).map((inv) => inv.symbol))];
    if (symbols.length === 0) return;

    fetch(`/api/stocks/logos?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((response) => response.json())
      .then((data) => setLogos(new Map(Object.entries(data?.logos ?? {}))))
      .catch(() => setLogos(new Map()));
  }, [investments]);

  // Fetch stock details for all symbols
  useEffect(() => {
    const symbols = [...new Set((investments ?? []).map((inv) => inv.symbol))];
    if (symbols.length === 0) return;

    const thisFetchId = ++fetchIdRef.current;

    fetch(`/api/stocks/details?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((res) => res.json())
      .then((data) => {
        if (thisFetchId !== fetchIdRef.current) return;
        if (data?.details) {
          const map = new Map<string, StockDetail>();
          for (const detail of data.details) {
            map.set(detail.symbol, detail);
          }
          setStockDetails(map);
        }
      })
      .catch(() => {});
  }, [investments]);

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return enriched;

    const query = searchQuery.toLowerCase();
    return enriched.filter(
      (inv) =>
        inv.symbol.toLowerCase().includes(query) ||
        inv.name.toLowerCase().includes(query)
    );
  }, [enriched, searchQuery]);

  const sorted = useMemo(() => {
    const data = [...searched];

    const getValue = (inv: EnrichedInvestment): string | number => {
      switch (sortKey) {
        case "portfolio":
          return inv.portfolio ?? "";
        case "symbol":
          return inv.symbol;
        case "name":
          return inv.name;
        case "day":
          return stockDetails.get(inv.symbol)?.changePercent ?? 0;
        case "dayRange": {
          const detail = stockDetails.get(inv.symbol);
          return detail ? detail.dayHigh - detail.dayLow : 0;
        }
        case "week52Range": {
          const detail = stockDetails.get(inv.symbol);
          return detail ? detail.week52High - detail.week52Low : 0;
        }
        case "shares":
          return inv.shares;
        case "last":
          return inv.current;
        case "avg":
          return inv.avg;
        case "book":
          return inv.book;
        case "market":
          return inv.market;
        case "gain":
          return inv.gain;
        case "gainPct":
          return inv.gainPct;
        default:
          return inv.market;
      }
    };

    data.sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return data;
  }, [searched, sortKey, sortDir, stockDetails]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const getDetail = (symbol: string): StockDetail | undefined => {
    return stockDetails.get(symbol);
  };

  return (
    <div className="w-full">
      {/* TABLE */}
      <div className="overflow-x-auto">
        <div className="mx-auto" style={{ minWidth: showPortfolio ? "1200px" : "1100px" }}>
          <table className="w-full table-fixed text-base">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {showPortfolio && <th className="py-3 text-center w-[8%]"><SortHeader label="PORTFOLIO" keyName="portfolio" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>}
                <th className="py-3 text-center w-[12%]"><SortHeader label="TICKER" keyName="symbol" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="COMPANY" keyName="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[8%]"><SortHeader label="DAY" keyName="day" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[12%]"><SortHeader label="DAY RANGE" keyName="dayRange" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[12%]"><SortHeader label="52W RANGE" keyName="week52Range" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[6%]"><SortHeader label="SHARES" keyName="shares" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="LAST" keyName="last" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="AVG" keyName="avg" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="BOOK" keyName="book" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="MARKET" keyName="market" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="GAIN $" keyName="gain" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center w-[7%]"><SortHeader label="GAIN %" keyName="gainPct" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} /></th>
                <th className="py-3 text-center text-base font-semibold text-muted-foreground w-[6%]">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((inv) => {
                const detail = getDetail(inv.symbol);
                const isPositive = detail ? detail.positive : inv.positive;

                const isExpanded = expandedInvestmentId === inv.id;
                const isEmptyHolding = !holdingIdsWithTransactions.has(inv.id);

                return (
                  <Fragment key={inv.id}>
                    <tr
                    className="border-b border-border last:border-none hover:bg-muted/40 transition-colors"
                  >
                    {showPortfolio && (
                      <td className="py-3 text-center text-muted-foreground w-[8%]">
                        {inv.portfolio || "Unassigned"}
                      </td>
                    )}
                    <td className="py-3 text-center font-semibold w-[12%]">
                      <div className="relative flex items-center justify-center">
                        <div className="inline-grid grid-cols-[1.25rem_4.5rem_1rem] items-center gap-x-2">
                          {logos.get(inv.symbol) ? (
                            <img src={logos.get(inv.symbol)} alt="" className="h-5 w-5 rounded-sm object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-muted text-[9px] text-muted-foreground">{inv.symbol.slice(0, 1)}</span>
                          )}
                          <Link href={`/investments/stocks/${encodeURIComponent(inv.symbol)}`} className="text-left hover:text-primary hover:underline">
                            {inv.symbol}
                          </Link>
                          {isEmptyHolding ? (
                            <button
                              type="button"
                              onClick={() => setExpandedInvestmentId(inv.id)}
                              aria-label={`Add transaction for ${inv.symbol}`}
                              title="Add transaction"
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-sky-500 transition hover:bg-sky-500/10 hover:text-sky-400 btn-press"
                            >
                              <Plus className="h-5 w-5" strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExpandedInvestmentId(isExpanded ? null : inv.id)}
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? "Hide" : "Show"} ${inv.symbol} transactions`}
                              className="inline-flex items-center text-muted-foreground hover:text-foreground"
                            >
                              <ChevronDown className={`h-4 w-4 shrink-0 transition-all duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center text-muted-foreground w-[7%] truncate max-w-0" title={inv.name}>
                      {inv.name}
                    </td>

                    {/* Sparkline */}
                    <td className="py-3 text-center w-[8%]">
                      {detail ? (
                        <Sparkline
                          data={detail.sparkline}
                          positive={isPositive}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">N/A</span>
                      )}
                    </td>

                    {/* Day Range */}
                    <td className="py-3 text-center w-[12%]">
                      {detail && detail.dayLow > 0 ? (
                        <RangeBar
                          low={detail.dayLow}
                          high={detail.dayHigh}
                          current={detail.price}
                          positive={isPositive}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">N/A</span>
                      )}
                    </td>

                    {/* 52W Range */}
                    <td className="py-3 text-center w-[12%]">
                      {detail && detail.week52Low > 0 ? (
                        <RangeBar
                          low={detail.week52Low}
                          high={detail.week52High}
                          current={detail.price}
                          positive={isPositive}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">N/A</span>
                      )}
                    </td>

                    <td className="py-3 text-center w-[6%]">{inv.shares}</td>
                    <td className="py-3 text-center w-[7%]">${inv.current.toLocaleString()}</td>
                    <td className="py-3 text-center w-[7%]">${inv.avg.toLocaleString()}</td>
                    <td className="py-3 text-center w-[7%]">${inv.book.toLocaleString()}</td>

                    <td className="py-3 text-center font-semibold w-[7%]">
                      ${inv.market.toLocaleString()}
                    </td>

                    <td className="py-3 text-center w-[7%]">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-base font-semibold ${
                          inv.positive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        }`}
                      >
                        {inv.positive ? "+" : ""}
                        ${Math.abs(inv.gain).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 text-center w-[7%]">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-base font-semibold ${
                          inv.gainPct >= 0
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        }`}
                      >
                        {inv.gainPct.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-3 text-center w-[6%]">
                      <div className="flex justify-center">
                        <InvestmentActions
                          id={inv.id}
                          name={inv.name}
                          symbol={inv.symbol}
                          shares={inv.shares}
                          purchasePrice={inv.avg}
                          currentPrice={inv.current}
                          purchaseDate={inv.purchase_date}
                          portfolio={inv.portfolio}
                          portfolios={portfolios}
                          onSuccess={onRefresh}
                        />
                      </div>
                    </td>
                    </tr>
                    {isExpanded && (
                      <HoldingTransactions
                        investmentId={inv.id}
                        symbol={inv.symbol}
                        columnCount={showPortfolio ? 14 : 13}
                        startNewTransaction={isEmptyHolding}
                        onSuccess={() => {
                          setHoldingIdsWithTransactions((current) => new Set(current).add(inv.id));
                          onRefresh?.();
                        }}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {!sorted.length && (
            <p className="text-muted-foreground mt-4">
              No investments match this filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
