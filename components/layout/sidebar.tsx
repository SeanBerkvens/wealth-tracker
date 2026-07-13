"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  TrendingUp,
  Calculator,
  Settings,
  ChevronDown,
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
      { name: "Investment Calculator", href: "/tools/investment-calculator" },
      { name: "Mortgage Calculator", href: "/tools/mortgage-calculator" },
      { name: "Compound Interest Calculator", href: "/tools/compound-interest-calculator" },
      { name: "Loan Calculator", href: "/tools/loan-calculator" },
      { name: "Mortgage Payoff Calculator", href: "/tools/mortgage-payoff-calculator" },
      { name: "Retirement Calculator", href: "/tools/retirement-calculator" },
      { name: "Interest Calculator", href: "/tools/interest-calculator" },
    ],
  },
];


export default function Sidebar() {

  const pathname = usePathname();

  const isInvestmentsActive = pathname.startsWith("/investments");
  const isToolsActive = pathname.startsWith("/tools");

  const [investmentsOpen, setInvestmentsOpen] = useState(isInvestmentsActive);
  const [toolsOpen, setToolsOpen] = useState(isToolsActive);

  const renderDropdown = (item: typeof navigation[number], isOpen: boolean, setIsOpen: (open: boolean) => void, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <div key={item.name} className="space-y-0.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`sidebar-link btn-press flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all duration-200 ${
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={`h-5 w-5 transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            />
            <span className="text-sm font-medium">
              {item.name}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {isOpen && (
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
                  <span className="text-sm font-medium">
                    {sub.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="
        w-64
        min-h-screen
        bg-sidebar
        text-sidebar-foreground
        border-r
        border-sidebar-border
        p-6
        flex
        flex-col
      "
    >


      {/* Branding */}
      <div className="mb-10">

        <h2
          className="
            text-xl
            font-semibold
            tracking-tight
          "
        >
          Wealth <span className="text-primary italic">Tracker</span>
        </h2>


        <p
          className="
            text-sm
            text-muted-foreground
            mt-1
          "
        >
          Build. Track. Grow.
        </p>

      </div>



      {/* Navigation */}
      <nav className="space-y-1.5 flex-1">

        {navigation.map((item) => {

          const Icon = item.icon;

          const active = item.subItems
            ? pathname.startsWith(item.href)
            : pathname === item.href;

          // For items with subItems, render expandable section
          if (item.subItems) {
            if (item.name === "Investments") {
              return renderDropdown(item, investmentsOpen, setInvestmentsOpen, isInvestmentsActive);
            }
            if (item.name === "Tools") {
              return renderDropdown(item, toolsOpen, setToolsOpen, isToolsActive);
            }
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link btn-press flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
              }`}
            >

              <Icon
                className={`h-5 w-5 transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />


              <span className="text-sm font-medium">
                {item.name}
              </span>

            </Link>
          );

        })}

      </nav>



      {/* Settings */}
      <Link
        href="/settings"
        className={`sidebar-link btn-press flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
          pathname === "/settings"
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm active"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-0.5"
        }`}
      >

        <Settings
          className={`h-5 w-5 transition-all duration-200 ${
            pathname === "/settings"
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        />


        <span className="text-sm font-medium">Settings</span>

      </Link>


    </aside>
  );
}