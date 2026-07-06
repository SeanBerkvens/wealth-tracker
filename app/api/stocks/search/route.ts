import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json([]);
    }

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      console.error("Missing FINNHUB_API_KEY");
      return NextResponse.json([]);
    }

    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    );

    const data = await res.json();

    return NextResponse.json(
      data?.result?.map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
      })) ?? []
    );
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json([]);
  }
}