"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import * as XLSX from "xlsx";

type ParsedRow = Record<string, string>;
type Field = "symbol" | "name" | "date" | "type" | "shares" | "price" | "commission" | "currency";
type ImportRow = { symbol: string; name?: string; date: string; type: "buy" | "sell" | "split" | "subdivision"; shares: number; price: number; commission: number; currency?: string; fxRate?: number; isOpening?: boolean };
type TickerResolution = { symbol: string; resolvedSymbol: string; currency: string; price: number; confirmed: boolean };
type CorporateCandidate = { key: string; symbol: string; name?: string; date: string; shares: number; currency?: string; description: string; suggested: "split" | "subdivision" };
type CorporateDecision = { mode: "skip" | "split" | "subdivision"; ratio?: string };

const fields: { key: Field; label: string; required?: boolean }[] = [
  { key: "symbol", label: "Ticker", required: true }, { key: "date", label: "Trade date", required: true },
  { key: "type", label: "Buy / sell", required: true }, { key: "shares", label: "Shares", required: true }, { key: "price", label: "Price", required: true },
  { key: "commission", label: "Commission" }, { key: "currency", label: "Currency" },
];
const aliases: Record<Field, string[]> = {
  symbol: ["symbol", "ticker", "security", "stock"], name: ["name", "company", "description", "security name"], date: ["date", "trade date", "transaction date", "transaction_date"],
  type: ["type", "action", "side", "transaction type", "activity_sub_type"], shares: ["shares", "quantity", "units"], price: ["price", "price/share", "price per share", "trade price", "unit price", "unit_price"],
  commission: ["commission", "fee", "fees"], currency: ["currency", "currency code"],
};

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const parseLine = (line: string) => { const cells: string[] = []; let cell = ""; let quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; } else quoted = !quoted; } else if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += char; } cells.push(cell.trim()); return cells; };
  const headers = parseLine(lines[0] ?? "").map((header) => header.trim());
  return { headers, rows: lines.slice(1).map(parseLine).filter((cells) => cells.some(Boolean)).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))) };
}
function parseXlsx(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  const headers = (values[0] ?? []).map((header) => String(header).trim());
  return {
    headers,
    rows: values.slice(1).filter((cells) => cells.some((cell) => String(cell).trim())).map((cells) => Object.fromEntries(headers.map((header, index) => [header, String(cells[index] ?? "").trim()]))),
  };
}
function number(value: string | undefined) { return Number((value ?? "").replace(/[$,]/g, "")); }
function commissionValue(value: string | undefined, shares: number, price: number) {
  const text = (value ?? "").trim().replace(/[$,\s]/g, "");
  if (!text) return 0;
  const isPercent = text.endsWith("%");
  const parsed = Number(text.replace(/%/g, "").replace(/^\((.*)\)$/, "-$1"));
  if (!Number.isFinite(parsed)) return Number.NaN;
  const amount = Math.abs(parsed);
  // Percentages must be explicit. A bare 0.50 is a 50¢ flat commission,
  // while 0.50% is calculated from the trade value.
  return isPercent ? (amount / 100) * Math.abs(shares) * price : amount;
}
function tradeDate(value: string | undefined) {
  const text = (value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})\b/);
  if (isoDate) return isoDate[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}
function transactionType(value: string | undefined) { const normalized = (value ?? "").toLowerCase(); return normalized.includes("subdivision") || normalized.includes("corrected quantity") ? "subdivision" : normalized.includes("split") ? "split" : normalized.includes("sell") ? "sell" : normalized.includes("buy") || normalized.includes("purchase") ? "buy" : null; }
function wealthsimpleFxRate(description: string | undefined) { const match = description?.match(/FX Rate:\s*([\d.]+)/i); return match ? Number(match[1]) : undefined; }
function stockSplitRatio(description: string | undefined) { const match = description?.match(/(\d+(?:\.\d+)?)\s*(?:for|:|\/|to)\s*(\d+(?:\.\d+)?)/i); if (!match) return 0; const ratio = Number(match[1]) / Number(match[2]); return Number.isFinite(ratio) && ratio > 0 ? ratio : 0; }
function looksLikeCorporateAction(value: string) { return /split|reverse split|consolidat|subdivision|share correction|corrected quantity|reorgani[sz]|spin-?off|merger|corporate action/i.test(value); }
function chronologicalImportOrder(a: ImportRow, b: ImportRow) {
  const dateOrder = a.date.localeCompare(b.date);
  if (dateOrder !== 0) return dateOrder;
  const rank = { buy: 0, split: 1, subdivision: 1, sell: 2 } as const;
  return rank[a.type] - rank[b.type];
}

export default function ImportInvestmentsCsv({ portfolios, onSuccess }: { portfolios: string[]; onSuccess?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false); const [headers, setHeaders] = useState<string[]>([]); const [rows, setRows] = useState<ParsedRow[]>([]); const [portfolio, setPortfolio] = useState(""); const [saving, setSaving] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const [tickerResolutions, setTickerResolutions] = useState<Record<string, TickerResolution>>({});
  const [tickerOverrides, setTickerOverrides] = useState<Record<string, string>>({});
  const [confirmedTickers, setConfirmedTickers] = useState<Record<string, boolean>>({});
  const [corporateDecisions, setCorporateDecisions] = useState<Record<string, CorporateDecision>>({});
  const [mapping, setMapping] = useState<Record<Field, string>>({ symbol: "", name: "", date: "", type: "", shares: "", price: "", commission: "", currency: "" });
  // Prefer each field's primary alias before falling back to later aliases.
  // This matters for broker exports that contain both `description` (the full
  // trade narrative) and `name` (the actual company name).
  const suggestedMapping = (nextHeaders: string[]) => Object.fromEntries(fields.map(({ key }) => [key, aliases[key].map((alias) => nextHeaders.find((header) => header.toLowerCase().trim() === alias)).find(Boolean) ?? ""])) as Record<Field, string>;
  const mappedRows = (): { valid: ImportRow[]; corporate: CorporateCandidate[]; invalid: number; ignored: number } => {
    const valid: ImportRow[] = []; const corporate: CorporateCandidate[] = []; let invalid = 0; let ignored = 0;
    const required = [mapping.symbol, mapping.date, mapping.type, mapping.shares, mapping.price];
    if (required.some((value) => !value)) return { valid, corporate, invalid: rows.length, ignored };
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rawDescription = row.description ?? row[mapping.name] ?? "";
      const rawActivity = [row[mapping.type], row.activity_type, row.activity_sub_type, rawDescription].filter(Boolean).join(" ");
      const type = transactionType(rawActivity);
      // Broker activity exports include deposits, dividends, interest, and FX rows.
      // This investment importer deliberately imports only explicit buys and sells.
      const symbol = (row[mapping.symbol] ?? "").trim().toUpperCase();
      const date = tradeDate(row[mapping.date]);
      const rawShares = number(row[mapping.shares]);
      const detectedRatio = stockSplitRatio(rawDescription);
      if ((!type || type === "split") && looksLikeCorporateAction(rawActivity) && /^[A-Z0-9.^-]{1,20}$/.test(symbol) && /^\d{4}-\d{2}-\d{2}$/.test(date) && (rawShares !== 0 || detectedRatio > 0)) {
        if (detectedRatio > 0) {
          valid.push({ symbol, name: row[mapping.name]?.trim(), date, type: "split", shares: detectedRatio, price: 0, commission: 0, currency: row[mapping.currency]?.trim().toUpperCase() || undefined, fxRate: wealthsimpleFxRate(row.description) });
        } else {
          corporate.push({ key: `${index}-${symbol}-${date}`, symbol, name: row[mapping.name]?.trim(), date, shares: rawShares, currency: row[mapping.currency]?.trim().toUpperCase() || undefined, description: rawDescription, suggested: type === "split" ? "split" : "subdivision" });
        }
        continue;
      }
      if (!type) { ignored += 1; continue; }
      const ratio = type === "split" ? stockSplitRatio(row.description) : 0;
      const itemShares = type === "split" ? ratio : type === "subdivision" ? rawShares : Math.abs(rawShares);
      const itemPrice = type === "split" || type === "subdivision" ? 0 : number(row[mapping.price]);
      const item: ImportRow = { symbol, name: row[mapping.name]?.trim(), date, type, shares: itemShares, price: itemPrice, commission: type === "split" || type === "subdivision" ? 0 : commissionValue(row[mapping.commission], itemShares, itemPrice), currency: row[mapping.currency]?.trim().toUpperCase() || undefined, fxRate: wealthsimpleFxRate(row.description) };
      if (!/^[A-Z0-9.^-]{1,20}$/.test(item.symbol) || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.shares <= 0 || item.price < 0 || !Number.isFinite(item.shares) || !Number.isFinite(item.price) || !Number.isFinite(item.commission)) invalid += 1; else valid.push(item);
    }
    return { valid, corporate, invalid, ignored };
  };
  const preview = mappedRows();
  const reviewedCorporateRows = useMemo<ImportRow[]>(() => {
    const reviewed: ImportRow[] = [];
    for (const candidate of preview.corporate) {
      const decision = corporateDecisions[candidate.key];
      if (!decision || decision.mode === "skip") continue;
      if (decision.mode === "split") {
        const ratio = Number(decision.ratio);
        if (Number.isFinite(ratio) && ratio > 0) reviewed.push({ symbol: candidate.symbol, name: candidate.name, date: candidate.date, type: "split", shares: ratio, price: 0, commission: 0, currency: candidate.currency });
      } else {
        reviewed.push({ symbol: candidate.symbol, name: candidate.name, date: candidate.date, type: "subdivision", shares: candidate.shares, price: 0, commission: 0, currency: candidate.currency });
      }
    }
    return reviewed;
  }, [rows, mapping, corporateDecisions]);
  const unresolvedCorporateActions = preview.corporate.filter((candidate) => {
    const decision = corporateDecisions[candidate.key];
    return !decision || (decision.mode === "split" && !(Number(decision.ratio) > 0));
  });
  const ledgerSourceRows = useMemo(() => [...preview.valid, ...reviewedCorporateRows], [preview.valid, reviewedCorporateRows]);
  const tickerValidationKey = useMemo(() => JSON.stringify([...new Map(ledgerSourceRows.map((row) => {
    // Wealthsimple's currency is the cash-settlement currency. An FX rate means
    // this was a foreign (currently USD) listing bought with CAD cash.
    const listingCurrency = row.fxRate && row.currency?.toUpperCase() === "CAD" ? "USD" : row.currency;
    return [`${row.symbol}|${listingCurrency ?? ""}`, { symbol: row.symbol, currency: listingCurrency }];
  })).values()]), [rows, mapping, corporateDecisions]);
  useEffect(() => {
    if (!tickerValidationKey || tickerValidationKey === "[]") { setTickerResolutions({}); return; }
    let active = true;
    void fetch("/api/investments/resolve-tickers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers: JSON.parse(tickerValidationKey) }) })
      .then((response) => response.ok ? response.json() : { resolutions: [] })
      .then((result) => { if (active) setTickerResolutions(Object.fromEntries((result.resolutions ?? []).map((item: TickerResolution) => [item.symbol, item]))); })
      .catch(() => { if (active) setTickerResolutions({}); });
    return () => { active = false; };
  }, [tickerValidationKey]);
  const importablePreview = useMemo(() => {
    const sharesHeld = new Map<string, number>(); let ignoredSales = 0; const rowsToImport: ImportRow[] = [];
    // Process in chronological order so every imported sell is supported by a
    // purchase also present in this CSV. Unsupported sells are simply excluded.
    for (const row of [...ledgerSourceRows].sort(chronologicalImportOrder)) {
      const held = sharesHeld.get(row.symbol) ?? 0;
      if (row.type === "sell" && row.shares > held + 0.000001) { ignoredSales += 1; continue; }
      sharesHeld.set(row.symbol, row.type === "buy" ? held + row.shares : row.type === "split" ? held * row.shares : row.type === "subdivision" ? held + row.shares : held - row.shares);
      rowsToImport.push(row);
    }
    return { rows: rowsToImport, ignoredSales };
  }, [ledgerSourceRows]);
  const unresolvedTickers = Object.values(tickerResolutions).filter((item) => !item.confirmed && !confirmedTickers[item.symbol]);
  const resolvedRows = importablePreview.rows.map((row) => ({ ...row, symbol: tickerOverrides[row.symbol]?.trim().toUpperCase() || tickerResolutions[row.symbol]?.resolvedSymbol || row.symbol }));
  async function importRows() { if (!resolvedRows.length || saving || unresolvedTickers.length || unresolvedCorporateActions.length) return; setSaving(true); setMessage(null); const response = await fetch("/api/investments/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: resolvedRows, portfolio: portfolio || null }) }); const result = await response.json(); setSaving(false); if (!response.ok) { setMessage(result.error ?? "Import failed."); return; } setMessage(`Imported ${result.imported} transaction${result.imported === 1 ? "" : "s"}; skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}.`); onSuccess?.(); }
  function close() { setOpen(false); setRows([]); setHeaders([]); setMessage(null); setTickerResolutions({}); setTickerOverrides({}); setConfirmedTickers({}); setCorporateDecisions({}); if (inputRef.current) inputRef.current.value = ""; }
  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-border bg-card px-4 py-2 text-card-foreground transition hover:bg-muted btn-press">Import CSV</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay"><div className="modal-content relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card p-6 text-card-foreground"><div className="mb-4 flex items-start justify-between"><div><h2 className="text-xl font-semibold">Import investments</h2><p className="mt-1 text-sm text-muted-foreground">Preview the mapped transactions before safely merging new records.</p></div><button type="button" onClick={close} disabled={saving} className="text-muted-foreground hover:text-foreground disabled:opacity-40">×</button></div>
      {!rows.length ? <div className="rounded-xl border border-dashed border-border p-10 text-center"><input ref={inputRef} type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const parsed = file.name.toLowerCase().endsWith(".xlsx") ? parseXlsx(await file.arrayBuffer()) : parseCsv(await file.text()); setHeaders(parsed.headers); setRows(parsed.rows); setMapping(suggestedMapping(parsed.headers)); } catch { setMessage("We could not read that file. Please choose a CSV or Excel (.xlsx) broker export."); } }} /><p className="text-sm text-muted-foreground">Upload a broker-exported CSV or Excel (.xlsx) file containing transactions.</p><button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground btn-press">Choose import file</button></div> : <div className="min-h-0 overflow-y-auto pr-1"><div className="mb-4 grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium">Import into portfolio<select value={portfolio} onChange={(event) => setPortfolio(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"><option value="">Unassigned</option>{portfolios.map((item) => <option key={item}>{item}</option>)}</select></label>{fields.map((field) => <label key={field.key} className="text-sm font-medium">{field.label}{field.required ? " *" : ""}<select value={mapping[field.key]} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"><option value="">Not mapped</option>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>)}</div>
        {preview.corporate.length > 0 && <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><p className="font-semibold text-amber-700 dark:text-amber-300">Review corporate actions</p><p className="mt-1 text-muted-foreground">These non-cash share changes could not be safely classified. Choose how each one should affect the holding, or skip it.</p><div className="mt-3 space-y-3">{preview.corporate.map((candidate) => { const decision = corporateDecisions[candidate.key]; return <div key={candidate.key} className="rounded-lg border border-amber-500/20 bg-background/40 p-3"><div className="flex flex-wrap items-center gap-x-3 gap-y-2"><span className="font-semibold">{candidate.symbol}</span><span className="text-muted-foreground">{candidate.date}</span><span className="text-muted-foreground">{candidate.shares} shares reported</span><select value={decision?.mode ?? ""} onChange={(event) => setCorporateDecisions((current) => { const next = { ...current }; if (!event.target.value) delete next[candidate.key]; else next[candidate.key] = { mode: event.target.value as CorporateDecision["mode"], ratio: current[candidate.key]?.ratio }; return next; })} className="rounded-md border border-border bg-background px-2 py-1"><option value="">Review required</option><option value="split">Stock split</option><option value="subdivision">Share adjustment</option><option value="skip">Skip</option></select>{decision?.mode === "split" && <input type="number" min="0.000001" step="any" value={decision.ratio ?? ""} onChange={(event) => setCorporateDecisions((current) => ({ ...current, [candidate.key]: { ...current[candidate.key], mode: "split", ratio: event.target.value } }))} placeholder="Split ratio" className="w-28 rounded-md border border-border bg-background px-2 py-1" />}</div><p className="mt-2 text-xs text-muted-foreground">{candidate.description}</p></div>; })}</div></div>}
        {Object.values(tickerResolutions).some((item) => !item.confirmed) && <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><p className="font-semibold text-amber-700 dark:text-amber-300">Ticker verification required</p><p className="mt-1 text-muted-foreground">We could not verify a market listing in the trade currency. Confirm or correct these tickers before importing so inactive matches are not added.</p><div className="mt-3 space-y-3">{Object.values(tickerResolutions).filter((item) => !item.confirmed).map((item) => <div key={item.symbol} className="flex flex-wrap items-center gap-3"><span className="w-16 font-medium">{item.symbol}</span><input value={tickerOverrides[item.symbol] ?? item.resolvedSymbol} onChange={(event) => setTickerOverrides((current) => ({ ...current, [item.symbol]: event.target.value }))} className="w-32 rounded-md border border-border bg-background px-2 py-1" aria-label={`${item.symbol} verified ticker`} /><span className="text-muted-foreground">{item.price > 0 ? `${item.currency || "Unknown currency"} quote found` : "No quote found"}</span><label className="flex items-center gap-2"><input type="checkbox" checked={!!confirmedTickers[item.symbol]} onChange={(event) => setConfirmedTickers((current) => ({ ...current, [item.symbol]: event.target.checked }))} />Use this ticker</label></div>)}</div></div>}
        <div className="mb-3 flex gap-3 text-sm"><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600">{importablePreview.rows.length} ready</span>{preview.ignored > 0 && <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">{preview.ignored} non-trades ignored</span>}{importablePreview.ignoredSales > 0 && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400">{importablePreview.ignoredSales} unsupported sales ignored</span>}{preview.invalid > 0 && <span className="rounded-full bg-red-500/10 px-3 py-1 text-red-600">{preview.invalid} invalid</span>}</div><div className="max-h-[420px] overflow-auto rounded-lg border border-border"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-2">Symbol</th><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2 text-right">Shares</th><th className="p-2 text-right">Price</th><th className="p-2">Currency</th></tr></thead><tbody>{importablePreview.rows.map((row, index) => <tr key={`${row.symbol}-${row.date}-${index}`} className="border-t border-border"><td className="p-2 font-medium">{tickerOverrides[row.symbol]?.trim().toUpperCase() || tickerResolutions[row.symbol]?.resolvedSymbol || row.symbol}</td><td className="p-2">{row.date}</td><td className="p-2 capitalize">{row.type}</td><td className="p-2 text-right">{row.shares}</td><td className="p-2 text-right">{row.price}</td><td className="p-2">{row.currency ?? "Listing currency"}</td></tr>)}</tbody></table></div></div>}
      {message && <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"><span className="flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-5 w-5" strokeWidth={3} /></span><span>{message}</span></div>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={close} disabled={saving} className="rounded-lg bg-muted px-4 py-2 text-sm btn-press disabled:opacity-40">{message ? "Done" : "Cancel"}</button>{rows.length > 0 && !message && <button type="button" disabled={!importablePreview.rows.length || preview.invalid > 0 || unresolvedTickers.length > 0 || unresolvedCorporateActions.length > 0 || saving} onClick={() => void importRows()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground btn-press disabled:opacity-50">{saving ? "Importing..." : `Import ${importablePreview.rows.length} transaction${importablePreview.rows.length === 1 ? "" : "s"}`}</button>}</div>
      {saving && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-card/95 backdrop-blur-sm"><span className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20"><LoaderCircle className="h-9 w-9 animate-spin text-primary" /><span className="absolute inset-0 animate-ping rounded-full border border-primary/30" /></span><p className="mt-5 text-lg font-semibold">Importing your transactions</p><p className="mt-1 text-sm text-muted-foreground">Your holdings will refresh automatically when this finishes.</p><div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-muted"><span className="block h-full w-1/2 animate-pulse rounded-full bg-primary" /></div></div>}
    </div></div>}
  </>;
}
