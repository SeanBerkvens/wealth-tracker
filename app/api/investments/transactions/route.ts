import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordHoldingTransaction, synchronizeHoldingFromTransactions } from "@/lib/investments/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json({ transaction: await recordHoldingTransaction(supabase, user.id, body) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save transaction." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { transactionId, ...values } = await request.json();
    if (!transactionId) throw new Error("Transaction not found.");
    const shares = Number(values.shares); const price = Number(values.price); const commission = Number(values.commission || 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date ?? "") || (values.type !== "buy" && values.type !== "sell") || shares <= 0 || price < 0 || commission < 0) throw new Error("Enter a valid date, type, shares, price, and commission.");
    const { data: existing, error: existingError } = await supabase.from("transactions").select("investment_id").eq("id", transactionId).eq("user_id", user.id).single();
    if (existingError || !existing?.investment_id) throw new Error("Transaction not found.");
    const { error } = await supabase.from("transactions").update({ date: values.date, type: values.type, shares, price, commission, note: values.note?.trim() || null }).eq("id", transactionId).eq("user_id", user.id);
    if (error) throw new Error(error.message);
    await synchronizeHoldingFromTransactions(supabase, user.id, existing.investment_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update transaction." }, { status: 400 });
  }
}
