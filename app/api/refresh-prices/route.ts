import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStockQuote } from "@/lib/yahoo";


export async function POST() {

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: investments } =
    await supabase
      .from("investments")
      .select("*")
      .eq("user_id", user.id);



  if (!investments) {

    return NextResponse.json({
      updated: 0
    });

  }



  for (const investment of investments) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, shares, price, commission")
      .eq("investment_id", investment.id)
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    // When transactions exist, they are the source of truth for the holding.
    let shares = Number(investment.shares) || 0;
    let costBasis = shares * (Number(investment.purchase_price) || 0);
    if (transactions?.length) {
      shares = 0;
      costBasis = 0;
      for (const transaction of transactions) {
        const transactionShares = Math.abs(Number(transaction.shares) || 0);
        if (transaction.type === "buy") {
          costBasis += transactionShares * Number(transaction.price) + (Number(transaction.commission) || 0);
          shares += transactionShares;
        } else if (transaction.type === "sell") {
          const sold = Math.min(shares, transactionShares);
          costBasis -= shares > 0 ? (costBasis / shares) * sold : 0;
          shares -= sold;
        } else if (transaction.type === "split") {
          shares *= transactionShares;
        } else if (transaction.type === "subdivision") {
          shares += Number(transaction.shares) || 0;
        }
      }
    }

    try {
      const quote = await getStockQuote(investment.symbol);
      await supabase
        .from("investments")
        .update({
          shares,
          purchase_price: shares > 0 ? costBasis / shares : 0,
          current_price: quote.price,
          value: shares * quote.price,
          // Yahoo reports the currency used by the exchange where the symbol trades.
          currency: quote.currency,
        })
        .eq("id", investment.id)
        .eq("user_id", user.id);
    } catch (error) {
      console.error(`Failed to refresh ${investment.symbol}:`, error);
    }


  }



  return NextResponse.json({

    updated:
      investments.length

  });


}
