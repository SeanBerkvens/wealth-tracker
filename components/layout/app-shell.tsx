"use client";

import { useAuth } from "@/components/auth/auth-provider";
import Sidebar from "@/components/layout/sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      {user && <Sidebar />}
      <main className={`flex-1 animate-fade-in ${user ? "p-8" : "p-0"}`}>
        {children}
      </main>
    </div>
  );
}