"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightLeft } from "lucide-react";

interface Transaction {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  price: number;
  type: "buy" | "sell";
  date: string;
  portfolio?: string | null;
  currency?: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  const hasData = transactions.length > 0;

  return (
    <div
      className="
        rounded-2xl
        bg-card
        border
        border-border
        p-6
        shadow-sm
        card-hover
      "
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Recent Activity
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Latest transactions
        </p>
      </div>

      {!hasData ? (
        <EmptyState variant="compact" icon={ArrowRightLeft} title="No recent activity" description="Transactions appear after you add trades to an investment holding." />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                bg-muted
                p-4
              "
            >
              <div>
                <p className="font-medium text-card-foreground">
                  {tx.symbol}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tx.shares} shares @ {new Intl.NumberFormat(undefined, { style: "currency", currency: tx.currency ?? "CAD" }).format(Number(tx.price))}
                  {tx.portfolio ? ` · ${tx.portfolio}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`font-semibold ${
                    tx.type === "buy"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.type === "buy" ? "Buy" : "Sell"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div className="mt-4 text-center">
          <Link
            href="/investments/portfolios"
            className="text-sm text-primary hover:underline"
          >
            View all transactions →
          </Link>
        </div>
      )}
    </div>
  );
}
