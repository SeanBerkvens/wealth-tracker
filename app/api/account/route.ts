import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  const { confirmation } = await request.json().catch(() => ({}));
  if (confirmation !== "DELETE") return NextResponse.json({ error: 'Type DELETE to confirm permanent account deletion.' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) return NextResponse.json({ error: "Account deletion is not configured. Contact support." }, { status: 503 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
  // Delete all owner-keyed data first, including future import/history helpers.
  const tables = ["transactions", "investments", "portfolios", "accounts", "assets", "liabilities", "watchlist", "portfolio_history", "investment_history", "import_jobs", "stock_splits"];
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", user.id);
    // PostgREST reports missing optional tables as an error; existing records must not be ignored.
    if (error && error.code !== "42P01" && error.code !== "PGRST205") return NextResponse.json({ error: "Could not remove account data." }, { status: 500 });
  }
  const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
  if (profileError) return NextResponse.json({ error: "Could not remove profile." }, { status: 500 });
  const { error: userError } = await admin.auth.admin.deleteUser(user.id);
  if (userError) return NextResponse.json({ error: "Could not delete account." }, { status: 500 });
  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true });
}
