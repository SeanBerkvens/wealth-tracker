"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignInButton } from "./sign-in-button";

type Mode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

function safeNext(value?: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function AuthCard({ mode, next, initialError }: { mode: Mode; next?: string | null; initialError?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError === "auth_callback_error" ? "We could not complete sign-in. Please try again." : null);
  const destination = safeNext(next);
  const reset = mode === "reset-password";
  const forgot = mode === "forgot-password";
  const signup = mode === "sign-up";
  const title = reset ? "Set a new password" : forgot ? "Reset your password" : signup ? "Create your account" : "Welcome back";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();
    const supabase = createClient();

    if (signup && password.length < 8) {
      setError("Use a password with at least 8 characters."); setLoading(false); return;
    }
    if (reset) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message); else setMessage("Your password has been updated. You can now continue to your dashboard.");
    } else if (forgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
      if (error) setError(error.message); else setMessage("If an account exists for that address, we sent password-reset instructions.");
    } else if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`, data: { display_name: displayName } },
      });
      if (error) setError(error.message);
      else if (data.session) window.location.assign(destination);
      else setMessage("Check your email to verify your address, then return here to sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message); else window.location.assign(destination);
    }
    setLoading(false);
  }

  return <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4 text-slate-900 sm:p-8">
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
      <section className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1.05fr_.95fr]">
        <div className="hidden bg-emerald-700 p-10 text-white md:flex md:flex-col md:justify-between">
          <div><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><ShieldCheck /></div><p className="text-2xl font-bold">AccuWealth</p></div>
          <div><h1 className="text-4xl font-semibold leading-tight">A clearer view of your financial future.</h1><p className="mt-4 max-w-sm text-emerald-50">Securely track your accounts, investments, and progress in one private place.</p></div>
          <p className="text-sm text-emerald-100">Private by design. Your financial data stays yours.</p>
        </div>
        <div className="p-7 sm:p-10">
          <Link href="/" className="text-xl font-bold text-emerald-700 md:hidden">AccuWealth</Link>
          <h2 className="mt-8 text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{reset ? "Choose a strong password you do not use elsewhere." : forgot ? "We’ll email a secure reset link." : signup ? "Start tracking with confidence." : "Sign in to see your complete financial picture."}</p>
          {!forgot && !reset && <div className="mt-7"><SignInButton next={destination} label={signup ? "Continue with Google" : "Continue with Google"} /><div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with email<span className="h-px flex-1 bg-slate-200" /></div></div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {signup && <label className="block text-sm font-medium">Name<input name="displayName" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-600" autoComplete="name" /></label>}
            {!reset && <label className="block text-sm font-medium">Email<input name="email" type="email" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-600" autoComplete="email" /></label>}
            {!forgot && <label className="block text-sm font-medium">Password<input name="password" type="password" required minLength={signup || reset ? 8 : undefined} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-600" autoComplete={reset || signup ? "new-password" : "current-password"} /></label>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{reset ? "Update password" : forgot ? "Send reset link" : signup ? "Create account" : "Sign in"}</button>
          </form>
          {mode === "sign-in" && <p className="mt-5 text-sm text-slate-500"><Link href="/auth/forgot-password" className="font-medium text-emerald-700 hover:underline">Forgot password?</Link> <span className="mx-2">·</span> New here? <Link href="/auth/sign-up" className="font-medium text-emerald-700 hover:underline">Create an account</Link></p>}
          {mode === "sign-up" && <p className="mt-5 text-sm text-slate-500">Already have an account? <Link href="/auth/sign-in" className="font-medium text-emerald-700 hover:underline">Sign in</Link></p>}
          {(forgot || reset) && <p className="mt-5 text-sm text-slate-500"><Link href="/auth/sign-in" className="font-medium text-emerald-700 hover:underline">Back to sign in</Link></p>}
        </div>
      </section>
    </div>
  </main>;
}
