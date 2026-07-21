"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmSignOut } from "@/components/auth/confirm-sign-out";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  TrendingUp,
  Calculator,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sun,
  Moon,
  User,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: Wallet,
  },
  {
    name: "Assets & Liabilities",
    href: "/assets",
    icon: Building2,
  },
  {
    name: "Investments",
    href: "/investments/portfolios",
    icon: TrendingUp,
    subItems: [
      { name: "Portfolios", href: "/investments/portfolios" },
      { name: "Watchlist", href: "/investments/watchlist" },
      { name: "News", href: "/investments/news" },
    ],
  },
  {
    name: "Tools",
    href: "/tools",
    icon: Calculator,
    subItems: [
      { name: "Mortgage Calculator", href: "/tools/mortgage-calculator" },
      { name: "Compound Interest Calculator", href: "/tools/compound-interest-calculator" },
      { name: "Loan Calculator", href: "/tools/loan-calculator" },
      { name: "Mortgage Payoff Calculator", href: "/tools/mortgage-payoff-calculator" },
      { name: "Retirement Calculator", href: "/tools/retirement-calculator" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  // Initialize collapsed from localStorage via lazy initialState
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  const [investmentsOpen, setInvestmentsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Save collapsed state to localStorage on change
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const isInvestmentsActive = pathname.startsWith("/investments");
  const isToolsActive = pathname.startsWith("/tools");
  const isSettingsActive = pathname === "/settings";

  // Auto-open sub-menus when navigating to a section
  if (isInvestmentsActive && !investmentsOpen) {
    setInvestmentsOpen(true);
  }
  if (isToolsActive && !toolsOpen) {
    setToolsOpen(true);
  }

  const handleCollapsedClick = () => {
    if (collapsed) {
      setCollapsed(false);
      return true; // indicates we handled it
    }
    return false;
  };

  const renderDropdown = (
    item: (typeof navigation)[number],
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    isActive: boolean
  ) => {
    const Icon = item.icon;
    return (
      <div key={item.name} className="space-y-0.5">
        <button
          onClick={() => {
            if (handleCollapsedClick()) return;
            setIsOpen(!isOpen);
          }}
          className={`sidebar-link btn-press flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all duration-200 ${
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
          }`}
          title={collapsed ? item.name : undefined}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              {item.name}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-all duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            } ${isOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>

        {isOpen && !collapsed && (
          <div className="ml-2 space-y-0.5">
            {item.subItems!.map((sub) => {
              const subActive = pathname === sub.href;
              return (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={`sidebar-link btn-press flex items-center gap-3 rounded-xl pl-10 pr-3 py-2 transition-all duration-200 ${
                    subActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
                  }`}
                >
                  <span className="text-sm font-medium">{sub.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside
      className={`
        ${collapsed ? "w-16" : "w-64"}
        min-h-screen
        bg-sidebar
        text-sidebar-foreground
        border-r
        border-sidebar-border
        px-3
        py-4
        flex
        flex-col
        transition-all
        duration-300
        ease-in-out
        shrink-0
        overflow-hidden
      `}
    >
      {/* Collapse Toggle + Branding Row */}
      <div
        className={`flex items-center mb-8 ${
          collapsed ? "justify-center" : "justify-between px-2"
        }`}
      >
        <div className="flex items-center gap-2">
          {collapsed && (
            <h2 className="text-xl font-bold text-primary italic">WT</h2>
          )}
          <div
            className={`transition-all duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold tracking-tight whitespace-nowrap">
              Wealth <span className="text-primary italic">Tracker</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
              Build. Track. Grow.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link btn-press rounded-xl p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="space-y-1.5 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.subItems
            ? pathname.startsWith(item.href)
            : pathname === item.href;

          if (item.subItems) {
            if (item.name === "Investments") {
              return renderDropdown(
                item,
                investmentsOpen,
                setInvestmentsOpen,
                isInvestmentsActive
              );
            }
            if (item.name === "Tools") {
              return (
                <div key={item.name}>
                  {renderDropdown(
                    item,
                    toolsOpen,
                    setToolsOpen,
                    isToolsActive
                  )}
                  {/* Divider + Settings after Tools */}
                  <div className="border-t border-sidebar-border my-3" />
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        if (handleCollapsedClick()) return;
                        setSettingsOpen(!settingsOpen);
                      }}
                      className={`sidebar-link btn-press flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        isSettingsActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
                      }`}
                      title={collapsed ? "Settings" : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Settings
                          className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                            isSettingsActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                          }`}
                        >
                          Settings
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                        } ${settingsOpen ? "rotate-0" : "-rotate-90"}`}
                      />
                    </button>

                    {settingsOpen && !collapsed && (
                      <div className="ml-2 space-y-0.5">
                        {/* User Info */}
                        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                          className="sidebar-link btn-press flex w-full items-center gap-3 rounded-xl pl-3 pr-3 py-2 transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          {theme === "dark" ? (
                            <Sun className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Moon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium">
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                          </span>
                        </button>

                        {/* Sign Out */}
                        <button
                          onClick={() => setShowSignOutConfirm(true)}
                          className="sidebar-link btn-press flex w-full items-center gap-3 rounded-xl pl-3 pr-3 py-2 transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <LogOut className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleCollapsedClick}
              className={`sidebar-link btn-press flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Confirm Sign Out Dialog */}
      <ConfirmSignOut
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
      />
    </aside>
  );
}