"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Building2, CircleDollarSign, TrendingDown, TrendingUp } from "lucide-react";

type StockPoint = { date: string; close: number };
type StockQuote = {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  exchange: string;
  open: number;
  dayLow: number;
  dayHigh: number;
  week52Low: number;
  week52High: number;
  volume: number;
  averageVolume: number;
  bid: number;
  ask: number;
  marketCap: number;
  sharesOutstanding: number;
  peRatio: number;
  description: string;
};
type ViewerResponse = { history: StockPoint[]; quote: StockQuote | null; error?: string };

const intervals = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "10Y"];

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value || 0);
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value || 0);
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-base font-semibold">{value}</dd></div>;
}

export default function StockViewer({
  symbol,
  name,
  shares,
  bookValue,
  allocation,
}: {
  symbol: string;
  name: string;
  shares: number;
  bookValue: number;
  allocation: number;
}) {
  const [interval, setInterval] = useState("1D");
  const [data, setData] = useState<ViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadStock() {
      setLoading(true);
      try {
        const response = await fetch(`/api/stocks/${encodeURIComponent(symbol)}?interval=${interval}`);
        const result = await response.json();
        if (!cancelled) setData(response.ok ? result : { error: result.error ?? "Unable to load this stock.", history: [], quote: null });
      } catch {
        if (!cancelled) setData({ error: "Unable to load this stock.", history: [], quote: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadStock();
    return () => { cancelled = true; };
  }, [symbol, interval]);

  useEffect(() => {
    fetch(`/api/stocks/logos?symbols=${encodeURIComponent(symbol)}`)
      .then((response) => response.json())
      .then((result) => setLogo(result?.logos?.[symbol] ?? null))
      .catch(() => setLogo(null));
  }, [symbol]);

  const quote = data?.quote;
  const periodChange = useMemo(() => {
    const history = data?.history ?? [];
    if (history.length < 2) return null;
    const first = history[0].close;
    const last = history[history.length - 1].close;
    return { value: last - first, percent: first ? ((last - first) / first) * 100 : 0 };
  }, [data?.history]);
  const positive = (periodChange?.value ?? quote?.change ?? 0) >= 0;
  const chartColor = positive ? "#10b981" : "#f43f5e";
  const positionValue = shares * (quote?.price ?? 0);
  const marketStatus = quote?.marketState === "REGULAR" ? "Market open" : quote?.marketState === "PRE" ? "Pre-market" : quote?.marketState === "POST" ? "After hours" : "Market closed";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <Link href="/investments/portfolios" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to portfolios
      </Link>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {logo ? <img src={logo} alt="" className="h-7 w-7 rounded-md object-contain" onError={() => setLogo(null)} /> : <Building2 className="h-6 w-6" />}
          </div>
          <div><h1 className="text-2xl font-bold tracking-tight">{symbol}</h1><p className="text-muted-foreground">{quote?.name ?? name}</p></div>
        </div>

        {loading ? (
          <div className="flex h-[390px] items-center justify-center text-muted-foreground">Loading market data...</div>
        ) : !quote || data?.error ? (
          <div className="flex h-[390px] items-center justify-center text-rose-500">{data?.error ?? "No market data is available."}</div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2"><p className="text-4xl font-bold tracking-tight sm:text-5xl">{money(quote.price, quote.currency)}</p><span className="text-sm font-semibold text-muted-foreground">{quote.currency}</span></div>
                <div className={`mt-2 flex items-center gap-1 font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{positive ? "+" : ""}{money(periodChange?.value ?? quote.change, quote.currency)} ({(periodChange?.percent ?? quote.changePercent).toFixed(2)}%)</span>
                  <span className="text-sm font-medium">over {interval}</span>
                </div>
              </div>
              <span className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">{marketStatus}</span>
            </div>

            <div className="mt-5 h-64 sm:h-80">
              {data.history.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.history}><defs><linearGradient id="stock-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor} stopOpacity={0.25} /><stop offset="100%" stopColor={chartColor} stopOpacity={0} /></linearGradient></defs><XAxis dataKey="date" hide /><YAxis domain={["dataMin", "dataMax"]} hide /><Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 12 }} labelFormatter={(label) => new Date(label).toLocaleString()} formatter={(value) => [money(Number(value), quote.currency), "Price"]} /><Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2.5} fill="url(#stock-area)" /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-muted-foreground">No chart data for this period.</div>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
              {intervals.map((item) => <button key={item} type="button" onClick={() => setInterval(item)} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition btn-press ${interval === item ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item}</button>)}
            </div>
          </>
        )}
      </section>

      {quote && !data?.error && <>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Your position</h2></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"><Detail label="Position" value={`${shares.toLocaleString()} shares`} /><Detail label="Allocation" value={`${allocation.toFixed(2)}%`} /><Detail label="Average cost" value={shares ? money(bookValue / shares, quote.currency) : "—"} /><Detail label="Current price" value={money(quote.price, quote.currency)} /><Detail label="Market value" value={money(positionValue, quote.currency)} /></div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="text-xl font-semibold">Market details</h2><dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Open" value={money(quote.open, quote.currency)} /><Detail label="Bid" value={quote.bid ? money(quote.bid, quote.currency) : "—"} /><Detail label="Ask" value={quote.ask ? money(quote.ask, quote.currency) : "—"} /><Detail label="Last sale" value={money(quote.price, quote.currency)} /><Detail label="Day high" value={money(quote.dayHigh, quote.currency)} /><Detail label="Day low" value={money(quote.dayLow, quote.currency)} /><Detail label="52-week high" value={money(quote.week52High, quote.currency)} /><Detail label="52-week low" value={money(quote.week52Low, quote.currency)} /><Detail label="Volume" value={compact(quote.volume)} /><Detail label="Average volume" value={compact(quote.averageVolume)} /><Detail label="Exchange" value={quote.exchange} /></dl></section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="text-xl font-semibold">Financials</h2><dl className="mt-5 grid gap-6 sm:grid-cols-3"><Detail label="Market cap" value={compact(quote.marketCap)} /><Detail label="Shares outstanding" value={compact(quote.sharesOutstanding)} /><Detail label="P/E ratio" value={quote.peRatio ? quote.peRatio.toFixed(2) : "—"} /></dl></section>

        {quote.description && <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="text-xl font-semibold">About {symbol}</h2><p className="mt-4 max-w-5xl leading-7 text-muted-foreground">{quote.description}</p></section>}
      </>}
    </div>
  );
}
