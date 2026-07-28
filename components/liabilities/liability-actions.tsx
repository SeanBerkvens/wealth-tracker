"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AssetIcon, assetIconOptions, iconColorOptions } from "@/components/assets/asset-icon";
import { EllipsisVertical } from "lucide-react";

interface LiabilityActionsProps {
  id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  iconColor: string;
}

export default function LiabilityActions({ id, name, category, value, icon, iconColor }: LiabilityActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newCategory, setNewCategory] = useState(category);
  const [newValue, setNewValue] = useState(value.toString());
  const [newIcon, setNewIcon] = useState(icon);
  const [newIconColor, setNewIconColor] = useState(iconColor);

  useEffect(() => {
    const closeOtherMenus = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) {
        window.setTimeout(() => {
          setMenuOpen(false);
          setEditing(false);
        }, 0);
      }
    };
    window.addEventListener("asset-item-menu-open", closeOtherMenus);
    return () => window.removeEventListener("asset-item-menu-open", closeOtherMenus);
  }, [id]);

  async function updateLiability() {
    const { error } = await supabase
      .from("liabilities")
      .update({ name: newName, category: newCategory, value: Number(newValue), icon: newIcon, icon_color: newIconColor })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function deleteLiability() {
    if (!confirm("Delete this liability?")) return;
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    if (!error) router.refresh();
  }

  function toggleMenu() {
    if (!menuOpen) window.dispatchEvent(new CustomEvent("asset-item-menu-open", { detail: id }));
    setMenuOpen(!menuOpen);
  }

  return (
    <>
      <div className="relative">
        <button type="button" onClick={toggleMenu} title="Liability options" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground btn-press"><EllipsisVertical className="h-6 w-6" /></button>
        {menuOpen && (
          <div className="option-menu absolute right-0 z-20 mt-1 w-28 rounded-lg border border-border bg-popover p-1 shadow-lg">
            <button type="button" onClick={() => { setEditing(true); setMenuOpen(false); }} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">Edit</button>
            <button type="button" onClick={deleteLiability} className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10">Delete</button>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-overlay">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 modal-content">
            <h2 className="text-xl font-semibold">Edit Liability</h2>
            <input value={newName} onChange={(event) => setNewName(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input type="number" min="0" step="0.01" value={newValue} onChange={(event) => setNewValue(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <div className="grid grid-cols-4 gap-2">{assetIconOptions.map((option) => <button key={option.value} type="button" onClick={() => setNewIcon(option.value)} title={option.label} className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${newIcon === option.value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}><AssetIcon name={option.value} />{option.label}</button>)}</div>
            <div className="flex flex-wrap gap-2">{iconColorOptions.map((color) => <button key={color} type="button" onClick={() => setNewIconColor(color)} aria-label={`Use ${color}`} className={`h-7 w-7 rounded-full border-2 ${newIconColor === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="rounded-lg bg-muted px-4 py-2 btn-press">Cancel</button>
              <button onClick={updateLiability} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground btn-press">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
