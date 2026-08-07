import { AuthCard } from "@/components/auth/auth-card";
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) { const { next, error } = await searchParams; return <AuthCard mode="sign-in" next={next} initialError={error} />; }
