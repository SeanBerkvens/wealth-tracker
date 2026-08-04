import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveListingSymbol } from "@/lib/yahoo";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tickers } = await request.json() as { tickers?: { symbol?: string; currency?: string }[] };
  if (!Array.isArray(tickers) || tickers.length > 100) return NextResponse.json({ error: "Provide up to 100 tickers." }, { status: 400 });

  const resolutions = await Promise.all(tickers.map(async ({ symbol, currency }) => {
    if (!symbol || !/^[A-Za-z0-9.^-]{1,20}$/.test(symbol)) return null;
    return resolveListingSymbol(symbol, currency);
  }));
  return NextResponse.json({ resolutions: resolutions.filter(Boolean) });
}
