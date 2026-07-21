"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import Sidebar from "@/components/layout/sidebar";
import { Menu, X } from "lucide-react";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {user && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - hidden by default on mobile, shown as overlay when open */}
      {user && (
        <div className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-10 rounded-lg p-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 animate-fade-in ${user ? "p-4 sm:p-6 lg:p-8" : "p-0"}`}>
        {/* Mobile header with hamburger */}
        {user && (
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border bg-card p-2 text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-lg">Wealth Tracker</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}