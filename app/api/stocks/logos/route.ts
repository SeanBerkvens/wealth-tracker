import { NextResponse } from "next/server";

type CompanyProfile = { logo?: string };

export async function GET(request: Request) {
  const symbols = [...new Set((new URL(request.url).searchParams.get("symbols") ?? "").split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey || symbols.length === 0) {
    return NextResponse.json({ logos: {} });
  }

  const entries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`, { next: { revalidate: 86400 } });
        const profile = (await response.json()) as CompanyProfile;
        return profile.logo ? [symbol, profile.logo] as const : null;
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({ logos: Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)) }, { headers: { "Cache-Control": "public, max-age=86400" } });
}
