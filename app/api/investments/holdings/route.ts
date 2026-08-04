import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHolding } from "@/lib/investments/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { symbol, name, portfolio } = await request.json();
    return NextResponse.json({ holding: await createHolding(supabase, user.id, { symbol, name, portfolio }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create holding." }, { status: 400 });
  }
}
