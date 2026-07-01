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
    <aside className="
      w-64
      min-h-screen
      bg-neutral-50
      p-6
      flex
      flex-col
    ">


      {/* Branding */}
      <div className="mb-10">

        <h2 className="
  text-xl
  font-semibold
  tracking-tight
">
  Wealth <span className="text-[#D4AF37] italic">Tracker</span>
</h2>

        <p className="
  text-sm
  text-neutral-500
  mt-1
">
          Build. Track. Grow.
        </p>

      </div>



      {/* Navigation */}
      <nav className="space-y-2 flex-1">

        {navigation.map((item) => {

          const Icon = item.icon;

          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                transition

                ${active
                  ? "bg-neutral-200 text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                }
              `}
            >

              <Icon
                className={`
                  h-5
                  w-5

                  ${active
                    ? "text-[#D4AF37]"
                    : "text-neutral-500"
                  }
                `}
              />

              <span>
                {item.name}
              </span>

            </Link>
          );

        })}

      </nav>



      {/* Settings */}
      <Link
        href="/settings"
        className={`
          flex
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          transition

          ${pathname === "/settings"
            ? "bg-neutral-200 text-neutral-900 shadow-sm"
            : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          }
        `}
      >

        <Settings
          className={`
            h-5
            w-5

            ${pathname === "/settings"
              ? "text-[#D4AF37]"
              : "text-neutral-500"
            }
          `}
        />

        Settings

      </Link>


    </aside>
  );
}