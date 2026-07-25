import { NextResponse } from "next/server";
import { getStockQuoteDetails } from "@/lib/yahoo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ details: [] });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ details: [] });
  }

  const details = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const result = await getStockQuoteDetails(symbol);
      return { symbol, ...result };
    })
  );

  const results: unknown[] = [];
  for (const r of details) {
    if (r.status === "fulfilled") {
      results.push(r.value);
    }
  }

  return NextResponse.json({ details: results });
}