"use client";

import { useState } from "react";
import AssetActions from "@/components/assets/asset-actions";

type Asset = {
  id: string;
  name: string;
  category: string;
  value: number;
  is_ignored?: boolean;
  updated_at?: string;
  created_at?: string;
};

function formatUpdatedAt(timestamp?: string) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();

  const suffix = (() => {
    if (day % 10 === 1 && day !== 11) return "st";
    if (day % 10 === 2 && day !== 12) return "nd";
    if (day % 10 === 3 && day !== 13) return "rd";
    return "th";
  })();

  return `Last updated on ${weekday} ${month} ${day}${suffix}, ${year}`;
}

export default function AssetItem({ asset }: { asset: Asset }) {
  const [isIgnored, setIsIgnored] = useState(asset.is_ignored ?? false);
  const updatedLabel = formatUpdatedAt(asset.updated_at || asset.created_at);

  return (
    <div
      className={`rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${
        isIgnored ? "scale-[0.98] bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : "scale-100"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold">{asset.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {asset.category}{isIgnored ? " · Ignored from calculations" : ""}
          </p>
          {updatedLabel && (
            <p className="mt-2 text-sm text-muted-foreground">{updatedLabel}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <AssetActions
            id={asset.id}
            name={asset.name}
            category={asset.category}
            value={Number(asset.value)}
            isIgnored={isIgnored}
            onIgnoredChange={setIsIgnored}
          />
          <p className={`text-lg font-semibold transition-colors duration-300 ${isIgnored ? "text-zinc-600 dark:text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            ${Number(asset.value).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
