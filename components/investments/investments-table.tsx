"use client";

import { useMemo, useState } from "react";
import InvestmentActions from "@/components/investments/investment-actions";

type Investment = {
  id: string;
  symbol: string;
  name: string;
  shares: number | string;
  purchase_price: number | string;
  current_price: number | string;
  purchase_date?: string;
};

type Filter = "all" | "gainers" | "losers";

type SortKey =
  | "symbol"
  | "name"
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
    <th
      onClick={() => onToggle(keyName)}
      className="py-3 text-left cursor-pointer select-none whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {label}

        <span className="w-3 text-center">
          {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </span>
      </span>
    </th>
  );
}

export default function InvestmentsTable({
  investments = [],
  searchQuery = "",
  onRefresh,
}: {
  investments?: Investment[];
  searchQuery?: string;
  onRefresh?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("market");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
        ...inv,
        shares,
        avg,
        current,
        book,
        market,
        gain,
        gainPct,
        positive: gain >= 0,
      };
    });
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

  const filtered = useMemo(() => {
    return searched.filter((inv) => {
      if (filter === "gainers") return inv.gain >= 0;
      if (filter === "losers") return inv.gain < 0;
      return true;
    });
  }, [searched, filter]);

  const sorted = useMemo(() => {
    const data = [...filtered];

    const getValue = (inv: EnrichedInvestment): string | number => {
      switch (sortKey) {
        case "symbol":
          return inv.symbol;
        case "name":
          return inv.name;
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
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md border text-sm ${
            filter === "all" ? "bg-primary text-white" : ""
          }`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("gainers")}
          className={`px-3 py-1 rounded-md border text-sm ${
            filter === "gainers" ? "bg-emerald-600 text-white" : ""
          }`}
        >
          Gainers
        </button>

        <button
          onClick={() => setFilter("losers")}
          className={`px-3 py-1 rounded-md border text-sm ${
            filter === "losers" ? "bg-rose-600 text-white" : ""
          }`}
        >
          Losers
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <SortHeader label="Ticker" keyName="symbol" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Company" keyName="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Shares" keyName="shares" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Last" keyName="last" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Avg" keyName="avg" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Book" keyName="book" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Market" keyName="market" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Gain $" keyName="gain" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
            <SortHeader label="Gain %" keyName="gainPct" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />

            <th className="py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((inv) => (
            <tr
              key={inv.id}
              className="border-b border-border last:border-none hover:bg-muted/40 transition-colors"
            >

              <td className="py-3 font-semibold">{inv.symbol}</td>
              <td className="py-3 text-muted-foreground">{inv.name}</td>

              <td className="py-3">{inv.shares}</td>
              <td className="py-3">${inv.current.toLocaleString()}</td>
              <td className="py-3">${inv.avg.toLocaleString()}</td>
              <td className="py-3">${inv.book.toLocaleString()}</td>

              <td className="py-3 font-semibold">
                ${inv.market.toLocaleString()}
              </td>

              <td className="py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                    inv.positive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                  }`}
                >
                  {inv.positive ? "+" : ""}
                  ${Math.abs(inv.gain).toLocaleString()}
                </span>
              </td>

              <td className="py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                    inv.gainPct >= 0
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                  }`}
                >
                  {inv.gainPct.toFixed(2)}%
                </span>
              </td>

              <td className="py-3">
                <div className="flex justify-start">
                  <InvestmentActions
                    id={inv.id}
                    name={inv.name}
                    symbol={inv.symbol}
                    shares={inv.shares}
                    purchasePrice={inv.avg}
                    currentPrice={inv.current}
                    purchaseDate={inv.purchase_date}
                    onSuccess={onRefresh}
                  />
                </div>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

      {!sorted.length && (
        <p className="text-muted-foreground mt-4">
          No investments match this filter.
        </p>
      )}

    </div>
  );
}