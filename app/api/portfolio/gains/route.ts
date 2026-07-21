import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStockQuote } from "@/lib/yahoo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const portfolio = searchParams.get("portfolio");

    // Create authenticated server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    let query = supabase.from("investments").select("*").eq("user_id", userId);
    if (portfolio) {
      query = query.eq("portfolio", portfolio);
    }
    const { data: investments } = await query;

    if (!investments || investments.length === 0) {
      return NextResponse.json({
        todayGainValue: 0,
        todayGainPercent: 0,
        unrealizedGainValue: 0,
        unrealizedGainPercent: 0,
        bookValue: 0,
        netDeposits: 0,
      });
    }

    let todayGainValue = 0;
    let portfolioValueYesterday = 0;
    let unrealizedGainValue = 0;
    let bookValue = 0;

    for (const investment of investments) {
      const shares = Number(investment.shares);
      const purchasePrice = Number(investment.purchase_price);

      try {
        const quote = await getStockQuote(investment.symbol);

        // Today's gain: shares * change
        todayGainValue += shares * quote.change;

        // Portfolio value at yesterday's close: shares * (price - change)
        portfolioValueYesterday += shares * (quote.price - quote.change);

        // Unrealized gain: shares * (current_price - purchase_price)
        unrealizedGainValue += shares * (quote.price - purchasePrice);

        bookValue += shares * purchasePrice;
      } catch (err) {
        console.error(
          `Failed to fetch quote for ${investment.symbol}:`,
          err
        );
      }
    }

    const todayGainPercent =
      portfolioValueYesterday > 0
        ? (todayGainValue / portfolioValueYesterday) * 100
        : 0;

    const unrealizedGainPercent =
      bookValue > 0
        ? (unrealizedGainValue / bookValue) * 100
        : 0;

    return NextResponse.json({
      todayGainValue: Math.round(todayGainValue * 100) / 100,
      todayGainPercent: Math.round(todayGainPercent * 100) / 100,
      unrealizedGainValue: Math.round(unrealizedGainValue * 100) / 100,
      unrealizedGainPercent: Math.round(unrealizedGainPercent * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      netDeposits: Math.round(bookValue * 100) / 100,
    });
  } catch (err) {
    console.error("Portfolio gains error:", err);
    return NextResponse.json({
      todayGainValue: 0,
      todayGainPercent: 0,
      unrealizedGainValue: 0,
      unrealizedGainPercent: 0,
      bookValue: 0,
      netDeposits: 0,
    });
  }
}