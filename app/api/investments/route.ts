import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: holdings, error: holdingsError } = await supabase
    .from("investments")
    .select("id")
    .eq("user_id", user.id);
  if (holdingsError) return NextResponse.json({ error: holdingsError.message }, { status: 500 });

  const ids = (holdings ?? []).map((holding) => holding.id);
  if (ids.length) {
    const { error: transactionError } = await supabase.from("transactions").delete().eq("user_id", user.id).in("investment_id", ids);
    if (transactionError) return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }
  const { error } = await supabase.from("investments").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: ids.length });
}
