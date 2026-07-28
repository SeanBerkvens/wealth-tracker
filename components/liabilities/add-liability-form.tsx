"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AssetIcon, assetIconOptions, iconColorOptions } from "@/components/assets/asset-icon";

export default function AddLiabilityForm({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [icon, setIcon] = useState("landmark");
  const [iconColor, setIconColor] = useState("#ef4444");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("liabilities").insert({
      name,
      category,
      value: Number(value),
      icon,
      icon_color: iconColor,
      user_id: user.id,
    });

    if (error) {
      console.error(error);
      return;
    }

    setOpen(false);
    setName("");
    setCategory("");
    setValue("");
    setIcon("landmark");
    setIconColor("#ef4444");
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`rounded-xl border border-border bg-card font-medium btn-press ${compact ? "px-3 py-1.5 text-sm" : "px-4 py-2"}`}>
        Add Liability
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-overlay">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 modal-content">
            <div>
              <h2 className="text-xl font-semibold">Add Liability</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add a debt or financial obligation to your balance sheet.</p>
            </div>
            <input required placeholder="Liability name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input required placeholder="Category (Mortgage, Loan...)" value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input required min="0" step="0.01" placeholder="Outstanding balance" type="number" value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <div><p className="mb-2 text-sm font-medium">Liability icon</p><div className="grid grid-cols-4 gap-2">{assetIconOptions.map((option) => <button key={option.value} type="button" onClick={() => setIcon(option.value)} title={option.label} className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${icon === option.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}><AssetIcon name={option.value} />{option.label}</button>)}</div></div>
            <div><p className="mb-2 text-sm font-medium">Icon color</p><div className="flex flex-wrap gap-2">{iconColorOptions.map((color) => <button key={color} type="button" onClick={() => setIconColor(color)} aria-label={`Use ${color}`} className={`h-7 w-7 rounded-full border-2 ${iconColor === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div></div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-muted px-4 py-2 btn-press">Cancel</button>
              <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground btn-press">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
