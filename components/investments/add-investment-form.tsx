"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Stock = {
  symbol: string;
  name: string;
};

export default function AddInvestmentForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [selected, setSelected] = useState<Stock | null>(null);

  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [transactionType, setTransactionType] = useState<"buy" | "sell">("buy");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchStocks = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(value)}`);

        if (!res.ok) {
          console.error("API error:", res.status);
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      }
    }, 250);
  };

  const selectStock = (stock: Stock) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected || !shares || !price) return;

    const sharesNum = Number(shares);
    const priceNum = Number(price);

    if (isNaN(sharesNum) || isNaN(priceNum) || sharesNum <= 0) {
      console.error("Invalid input");
      return;
    }

    setStatusMessage(null);

    // 1. Record the transaction
    const { error: txError } = await supabase.from("transactions").insert({
      symbol: selected.symbol,
      name: selected.name,
      shares: sharesNum,
      price: priceNum,
      type: transactionType,
      date: transactionDate,
    });

    if (txError) {
      console.error("Transaction error:", txError);
      console.error("Transaction error message:", txError.message);
      console.error("Transaction error details:", txError.details);
      console.error("Transaction error hint:", txError.hint);
      setStatusMessage(`Failed to record transaction: ${txError.message || "Unknown error"}`);
      return;
    }

    // 2. Check if this symbol already exists in investments
    const { data: existing } = await supabase
      .from("investments")
      .select("*")
      .eq("symbol", selected.symbol)
      .maybeSingle();

    if (transactionType === "buy") {
      // Fetch current price
      let currentPrice = null;
      try {
        const res = await fetch(`/api/stocks/price?symbol=${encodeURIComponent(selected.symbol)}`);
        const data = await res.json();
        if (data?.price && data.price > 0) {
          currentPrice = data.price;
        }
      } catch (err) {
        console.error("Failed to fetch current price:", err);
      }

      if (existing) {
        // BUY + existing symbol → update shares and recalculate average price
        const newShares = Number(existing.shares) + sharesNum;
        const totalCost = Number(existing.shares) * Number(existing.purchase_price) + sharesNum * priceNum;
        const newAvgPrice = totalCost / newShares;

        const { error: updateError } = await supabase
          .from("investments")
          .update({
            shares: newShares,
            purchase_price: newAvgPrice,
            current_price: currentPrice,
            value: newShares * (currentPrice || newAvgPrice),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Update error:", updateError);
          setStatusMessage("Transaction recorded but failed to update position.");
          return;
        }
      } else {
        // BUY + new symbol → insert new row
        const { error: insertError } = await supabase.from("investments").insert({
          name: selected.name,
          symbol: selected.symbol,
          shares: sharesNum,
          purchase_price: priceNum,
          current_price: currentPrice,
          value: currentPrice ? sharesNum * currentPrice : sharesNum * priceNum,
          purchase_date: transactionDate,
        });

        if (insertError) {
          console.error("Insert error:", insertError);
          console.error("Insert error message:", insertError.message);
          console.error("Insert error details:", insertError.details);
          console.error("Insert error hint:", insertError.hint);
          setStatusMessage(`Transaction recorded but failed to create position: ${insertError.message || "Unknown error"}`);
          return;
        }
      }
    } else {
      // SELL
      if (!existing) {
        setStatusMessage("Cannot sell a position that doesn't exist.");
        return;
      }

      const currentShares = Number(existing.shares);
      const newShares = currentShares - sharesNum;

      if (newShares <= 0) {
        // Position closed → delete the row
        const { error: deleteError } = await supabase
          .from("investments")
          .delete()
          .eq("id", existing.id);

        if (deleteError) {
          console.error("Delete error:", deleteError);
          setStatusMessage("Transaction recorded but failed to close position.");
          return;
        }

        setStatusMessage(`Position closed for ${selected.symbol}.`);
      } else {
        // Partial sell → update shares only (avg price stays the same)
        const { error: updateError } = await supabase
          .from("investments")
          .update({
            shares: newShares,
            value: newShares * Number(existing.current_price || existing.purchase_price),
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("Update error:", updateError);
          setStatusMessage("Transaction recorded but failed to update position.");
          return;
        }
      }
    }

    // Reset form
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelected(null);
    setShares("");
    setPrice("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setTransactionType("buy");

    onSuccess?.();
  };

  return (
    <div className="relative">

      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        + Transaction
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">

          <div className="w-full max-w-md p-6 rounded-xl bg-card text-card-foreground border border-border relative">

            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Add Transaction
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* BUY / SELL TOGGLE */}
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setTransactionType("buy")}
                  className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
                    transactionType === "buy"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType("sell")}
                  className={`flex-1 py-1.5 text-sm rounded-md font-medium transition ${
                    transactionType === "sell"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* SEARCH */}
              <input
                value={query}
                onChange={(e) => searchStocks(e.target.value)}
                placeholder="Search stock (AAPL, TSLA...)"
                className="w-full p-2 border rounded bg-background text-foreground"
              />

              {/* RESULTS */}
              {results.length > 0 && (
                <div className="border rounded bg-background max-h-40 overflow-y-auto relative z-50">
                  {results.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => selectStock(stock)}
                      className="p-2 hover:bg-muted cursor-pointer"
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {stock.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SELECTED */}
              {selected && (
                <div className="text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selected.symbol}</span>
                </div>
              )}

              {/* SHARES */}
              <input
                type="number"
                step="any"
                placeholder="Number of Shares"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
              />

              {/* PRICE */}
              <input
                type="number"
                step="0.01"
                placeholder="Price per Share"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
              />

              {/* DATE */}
              <label className="text-xs text-muted-foreground block">
                Transaction Date
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
              />

              {/* STATUS MESSAGE */}
              {statusMessage && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                  {statusMessage}
                </p>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="w-full py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                {transactionType === "buy" ? "Buy" : "Sell"}
              </button>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}