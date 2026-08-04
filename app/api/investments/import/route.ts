import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeCurrency } from "@/lib/currency-format";
import { createHolding, recordHoldingTransaction } from "@/lib/investments/service";

type ImportRow = { symbol: string; name?: string; date: string; type: "buy" | "sell" | "split" | "subdivision"; shares: number; price: number; commission?: number; currency?: string; fxRate?: number; isOpening?: boolean };

const fingerprint = (row: Pick<ImportRow, "symbol" | "date" | "type" | "shares" | "price" | "commission">) =>
  [row.symbol.toUpperCase(), row.date, row.type, row.shares, row.price, row.commission ?? 0].join("|");

const chronologicalImportOrder = (a: ImportRow, b: ImportRow) => {
  const dateOrder = a.date.localeCompare(b.date);
  if (dateOrder !== 0) return dateOrder;
  const rank = { buy: 0, split: 1, subdivision: 1, sell: 2 } as const;
  return rank[a.type] - rank[b.type];
};

export async function POST(request: Request) {
  try {
    const { rows, portfolio } = await request.json() as { rows: ImportRow[]; portfolio?: string | null };
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1_000) return NextResponse.json({ error: "Provide between 1 and 1,000 transactions." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const validRows = rows.filter((row) =>
      /^[A-Za-z0-9.^-]{1,20}$/.test(row.symbol ?? "") &&
      /^\d{4}-\d{2}-\d{2}$/.test(row.date ?? "") &&
      (row.type === "buy" || row.type === "sell" || row.type === "split" || row.type === "subdivision") &&
      Number.isFinite(row.shares) && (row.type === "subdivision" ? row.shares !== 0 : row.shares > 0) && Number.isFinite(row.price) && row.price >= 0
    ).map((row) => ({ ...row, symbol: row.symbol.toUpperCase(), commission: Number(row.commission) || 0 }));
    if (validRows.length !== rows.length) return NextResponse.json({ error: "One or more rows are invalid. Review the import preview." }, { status: 400 });

    const [{ data: existingTransactions }, { data: existingHoldings }] = await Promise.all([
      supabase.from("transactions").select("investment_id, symbol, date, type, shares, price, commission").eq("user_id", user.id),
      supabase.from("investments").select("id, symbol, portfolio, currency").eq("user_id", user.id),
    ]);
    // A deleted holding can leave historical transaction rows behind (older
    // delete paths used an ON DELETE SET NULL relationship). Those orphaned
    // rows must not block a fresh import, nor should another portfolio's
    // identical trade be considered a duplicate.
    const activeHoldingIds = new Set((existingHoldings ?? [])
      .filter((holding) => (holding.portfolio ?? "") === (portfolio ?? ""))
      .map((holding) => holding.id));
    const existingFingerprints = new Set((existingTransactions ?? [])
      .filter((row) => row.investment_id && activeHoldingIds.has(row.investment_id))
      .map((row) => fingerprint({ ...row, type: row.type as "buy" | "sell" | "split" | "subdivision" })));
    const importFingerprints = new Set<string>();
    const uniqueRows = validRows.filter((row) => {
      const key = fingerprint(row);
      if (existingFingerprints.has(key) || importFingerprints.has(key)) return false;
      importFingerprints.add(key);
      return true;
    });
    const skipped = validRows.length - uniqueRows.length;
    if (uniqueRows.length === 0) return NextResponse.json({ imported: 0, skipped, createdHoldings: 0 });

    const holdingByKey = new Map((existingHoldings ?? []).map((holding) => [`${holding.symbol}|${holding.portfolio ?? ""}`, holding]));
    const rawGrouped = new Map<string, ImportRow[]>();
    for (const row of uniqueRows) {
      const key = `${row.symbol}|${portfolio ?? ""}`;
      rawGrouped.set(key, [...(rawGrouped.get(key) ?? []), row]);
    }

    const investmentIdByKey = new Map<string, string>();
    const listingCurrencyByKey = new Map<string, string>();
    let createdHoldings = 0;
    for (const [key, group] of rawGrouped) {
      const existing = holdingByKey.get(key);
      if (existing) {
        investmentIdByKey.set(key, existing.id);
        listingCurrencyByKey.set(key, normalizeCurrency(existing.currency));
        continue;
      }
      const first = group[0];
      const holding = await createHolding(supabase, user.id, { symbol: first.symbol, name: first.name, portfolio, preferMarketName: true });
      investmentIdByKey.set(key, holding.id);
      listingCurrencyByKey.set(key, normalizeCurrency(holding.currency));
      createdHoldings += 1;
    }

    // Wealthsimple reports trade cash values in the account currency (usually CAD),
    // even for U.S.-listed stocks. Its description supplies the exact CAD/USD rate
    // used for that trade, which lets us preserve the transaction in listing currency.
    const normalizedRows = uniqueRows.map((row) => {
      const key = `${row.symbol}|${portfolio ?? ""}`;
      const sourceCurrency = normalizeCurrency(row.currency);
      const currency = listingCurrencyByKey.get(key) ?? sourceCurrency;
      const conversion = !row.isOpening && sourceCurrency !== currency && Number(row.fxRate) > 0
        ? sourceCurrency === "CAD" && currency === "USD" ? 1 / Number(row.fxRate) : sourceCurrency === "USD" && currency === "CAD" ? Number(row.fxRate) : 1
        : 1;
      return { ...row, currency, price: row.price * conversion, commission: (row.commission ?? 0) * conversion };
    });
    // Submit every row through the same transaction service used by the manual form.
    // Resolve a holding again if a cached id is no longer available. This keeps a
    // long-running import resilient while still using the exact manual workflow.
    for (const row of normalizedRows.sort(chronologicalImportOrder)) {
      const key = `${row.symbol}|${portfolio ?? ""}`;
      const saveTransaction = (investmentId: string) => recordHoldingTransaction(supabase, user.id, {
        investmentId,
        date: row.date, type: row.type, shares: row.shares, price: row.price, commission: row.commission,
      });
      try {
        await saveTransaction(investmentIdByKey.get(key)!);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not import transaction.";
        if (message === "Holding not found.") {
          // This is deliberately the same create-or-find operation as adding a
          // holding manually; it cannot duplicate a holding for this portfolio.
          const holding = await createHolding(supabase, user.id, { symbol: row.symbol, name: row.name, portfolio, preferMarketName: true });
          investmentIdByKey.set(key, holding.id);
          try {
            await saveTransaction(holding.id);
            continue;
          } catch (retryError) {
            throw new Error(`${row.symbol} on ${row.date}: ${retryError instanceof Error ? retryError.message : "Could not import transaction."}`);
          }
        }
        throw new Error(`${row.symbol} on ${row.date}: ${message}`);
      }
    }

    return NextResponse.json({ imported: uniqueRows.length, skipped, createdHoldings });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 });
  }
}
