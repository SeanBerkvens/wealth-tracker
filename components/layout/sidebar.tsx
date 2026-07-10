"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  TrendingUp,
  BarChart3,
  Settings,
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
    name: "Assets",
    href: "/assets",
    icon: Building2,
  },
  {
    name: "Investments",
    href: "/investments",
    icon: TrendingUp,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];


export default function Sidebar() {

  const pathname = usePathname();

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

          const active = pathname === item.href;

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