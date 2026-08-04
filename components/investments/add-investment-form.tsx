"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

type Stock = {
  symbol: string;
  name: string;
};

export default function AddInvestmentForm({
  onSuccess,
  portfolios = [],
}: {
  onSuccess?: () => void;
  portfolios?: string[];
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [selected, setSelected] = useState<Stock | null>(null);
  const [portfolio, setPortfolio] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setPortfolio("");
    setStatusMessage(null);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const searchStocks = (value: string) => {
    setQuery(value);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
    }, 250);
  };

  const selectStock = (stock: Stock) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setResults([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selected || saving) return;

    setSaving(true);
    setStatusMessage(null);

    const response = await fetch("/api/investments/holdings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selected.name, symbol: selected.symbol, portfolio: portfolio || null }) });
    const result = await response.json();
    if (!response.ok) {
      setStatusMessage(`Failed to create holding: ${result.error ?? "Unknown error"}`);
      setSaving(false);
      return;
    }

    closeModal();
    onSuccess?.();
    setSaving(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition btn-press"
      >
        + Holding
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 modal-overlay">
          <div className="w-full max-w-md p-6 rounded-xl bg-card text-card-foreground border border-border relative modal-content">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              ×
            </button>

            <h2 className="text-lg font-semibold mb-1">Add Holding</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              You can add transactions for this holding in the table afterwards.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={query}
                onChange={(event) => searchStocks(event.target.value)}
                placeholder="Search stock (AAPL, TSLA...)"
                className="w-full p-2 border rounded bg-background text-foreground"
              />

              {results.length > 0 && (
                <div className="border rounded bg-background max-h-40 overflow-y-auto">
                  {results.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => selectStock(stock)}
                      className="block w-full p-2 text-left hover:bg-muted"
                    >
                      <span className="block font-medium">{stock.symbol}</span>
                      <span className="block text-xs text-muted-foreground">{stock.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <p className="text-xs text-muted-foreground">
                  Selected: <span className="font-medium">{selected.symbol}</span>
                </p>
              )}

              <label className="text-xs text-muted-foreground block" htmlFor="holding-portfolio">
                Portfolio
              </label>
              <select
                id="holding-portfolio"
                value={portfolio}
                onChange={(event) => setPortfolio(event.target.value)}
                className="w-full p-2 border rounded bg-background text-foreground"
              >
                <option value="">No portfolio</option>
                {portfolios.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              {statusMessage && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                  {statusMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={!selected || saving}
                className="w-full py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition btn-press disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Holding"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
