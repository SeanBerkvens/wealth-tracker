"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SourceTable = "accounts" | "portfolios";

export default function SyncedItem({
  id,
  table,
  name,
  description,
  value,
  isIgnored,
  liability = false,
}: {
  id: string;
  table: SourceTable;
  name: string;
  description: string;
  value: number;
  isIgnored: boolean;
  liability?: boolean;
}) {
  const router = useRouter();
  const [ignored, setIgnored] = useState(isIgnored);

  async function toggleIgnored() {
    const nextIgnored = !ignored;
    setIgnored(nextIgnored);
    const { error } = await supabase.from(table).update({ is_ignored: nextIgnored }).eq("id", id);

    if (error) {
      console.error(error);
      setIgnored(!nextIgnored);
      return;
    }

    router.refresh();
  }

  return (
    <div className={`rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${ignored ? "scale-[0.98] bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : "scale-100"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}{ignored ? " · Ignored from calculations" : ""}</p>
        </div>
        <div className="flex self-center items-center gap-3">
          <button onClick={toggleIgnored} className="rounded-lg bg-muted/70 px-3 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
            {ignored ? "Include" : "Ignore"}
          </button>
          <p className={`text-lg font-semibold transition-colors duration-300 ${ignored ? "text-zinc-600 dark:text-zinc-500" : liability ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            ${value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
