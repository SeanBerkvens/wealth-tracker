import { NextResponse } from "next/server";
import { getExchangeRate, normalizeCurrency } from "@/lib/currency";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = normalizeCurrency(searchParams.get("from"));
  const to = normalizeCurrency(searchParams.get("to"));
  try {
    return NextResponse.json({ from, to, rate: await getExchangeRate(from, to) });
  } catch {
    return NextResponse.json({ error: `Exchange rate unavailable for ${from}/${to}` }, { status: 502 });
  }
}
