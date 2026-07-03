import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  const res = await fetch(
    `https://finnhub.io/api/v1/search?q=${query}&token=${process.env.FINNHUB_API_KEY}`
  );

  const data = await res.json();

  // Normalize Finnhub response
  const results =
    data?.result?.map((item: any) => ({
      symbol: item.symbol,
      name: item.description,
    })) ?? [];

  return NextResponse.json(results);
}