import { SignInButton } from "@/components/auth/sign-in-button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {/* Branding */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Wealth <span className="text-primary italic">Tracker</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Sign in to track your financial future
            </p>
          </div>

          {/* Sign In Options */}
          <div className="space-y-3">
            <SignInButton provider="google" label="Sign in with Google" />
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our terms and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}