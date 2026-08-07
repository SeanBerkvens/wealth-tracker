import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";

  const requestOrigin = new URL(request.url).origin;
  // Local development must complete the OAuth exchange on localhost. Vercel
  // uses the configured canonical production URL, with the request origin as
  // a safe fallback for preview deployments.
  const origin = process.env.VERCEL
    ? process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
    : requestOrigin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_error`);
}
