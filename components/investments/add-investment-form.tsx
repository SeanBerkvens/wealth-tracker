"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Suggestion = {
  symbol: string;
  name: string;
};

export default function AddInvestmentForm() {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [shares, setShares] = useState("");

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setShares("");
  };

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.length < 1) {
      setSuggestions([]);
      return;
    }

    setSuggestions(
      [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "MSFT", name: "Microsoft Corp." },
        { symbol: "TSLA", name: "Tesla Inc." },
      ].filter(
        (s) =>
          s.symbol.toLowerCase().includes(value.toLowerCase()) ||
          s.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const selectStock = (stock: Suggestion) => {
    setSelected(stock);
    setQuery(stock.symbol);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!selected) return;

    const fakePrice = 100;

    await supabase.from("investments").insert({
      symbol: selected.symbol,
      name: selected.name,
      shares: Number(shares),
      purchase_price: fakePrice,
      current_price: fakePrice,
      value: Number(shares) * fakePrice,
    });

    handleClose();
  };

  return (
    <div>
      {/* OPEN BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-primary text-white text-sm"
      >
        + Add
      </button>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-[420px] max-w-[95vw] rounded-xl border bg-card p-6 pt-16 shadow-xl">

            {/* HEADER */}
            <div className="absolute top-4 left-6 right-12">
              <h2 className="text-lg font-semibold">
                Add a Holding
              </h2>
            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={handleClose}
              className="
                absolute top-4 right-4
                w-8 h-8
                flex items-center justify-center
                rounded-full
                bg-red-500/10
                text-red-500
                hover:bg-red-500
                hover:text-white
                transition-colors
                text-sm
                font-bold
              "
              aria-label="Close"
            >
              ✕
            </button>

            {/* SEARCH STEP */}
            {!selected && (
              <>
                <input
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search ticker or company..."
                  className="w-full p-2 border rounded-md"
                />

                <div className="mt-2 max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <div
                      key={s.symbol}
                      onClick={() => selectStock(s)}
                      className="p-2 hover:bg-muted cursor-pointer rounded-md"
                    >
                      <div className="font-semibold">{s.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.name}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SELECTED STEP */}
            {selected && (
              <div className="space-y-3">
                <div>
                  <div className="font-semibold">{selected.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {selected.name}
                  </div>
                </div>

                <input
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="Shares"
                  className="w-full p-2 border rounded-md"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 border rounded-md py-2"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleSave}
                    className="flex-1 bg-primary text-white rounded-md py-2"
                  >
                    Add Holding
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}