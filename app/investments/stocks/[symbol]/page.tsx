import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StockViewer from "@/components/investments/stock-viewer";

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).trim().toUpperCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: investments } = await supabase
    .from("investments")
    .select("symbol, name, shares, purchase_price, value")
    .eq("user_id", user.id);

  const holdings = (investments ?? []).filter((investment) => investment.symbol === symbol);
  if (holdings.length === 0) notFound();

  const totalValue = (investments ?? []).reduce((total, investment) => total + Number(investment.value), 0);
  const positionValue = holdings.reduce((total, holding) => total + Number(holding.value), 0);

  return (
    <StockViewer
      symbol={symbol}
      name={holdings[0].name}
      shares={holdings.reduce((total, holding) => total + Number(holding.shares), 0)}
      bookValue={holdings.reduce((total, holding) => total + Number(holding.shares) * Number(holding.purchase_price), 0)}
      allocation={totalValue > 0 ? (positionValue / totalValue) * 100 : 0}
    />
  );
}
