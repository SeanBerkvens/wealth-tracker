"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { AssetIcon, assetIconOptions, iconColorOptions } from "@/components/assets/asset-icon";


export default function AddAssetForm({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [icon, setIcon] = useState("wallet");
  const [iconColor, setIconColor] = useState("#06b6d4");


  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    if (!user) return;

    const { error } = await supabase
      .from("assets")
      .insert({
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


    setName("");
    setCategory("");
    setValue("");
    setIcon("wallet");
    setIconColor("#06b6d4");

    setOpen(false);

    router.refresh();

  }


  return (
    <>


      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-xl bg-primary font-medium text-primary-foreground btn-press ${compact ? "px-3 py-1.5 text-sm" : "px-4 py-2"}`}
      >
        Add Asset
      </button>



      {open && (

        <div
          className="
            fixed
            inset-0
            flex
            items-center
            justify-center
            bg-black/40
            z-50
            modal-overlay
          "
        >

          <form
            onSubmit={handleSubmit}
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-card
              border
              border-border
              p-6
              space-y-4
              modal-content
            "
          >

            <h2 className="text-xl font-semibold">
              Add Asset
            </h2>


            <input
              placeholder="Asset Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              placeholder="Category (Home, Vehicle...)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              placeholder="Value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />

            <div>
              <p className="mb-2 text-sm font-medium">Asset icon</p>
              <div className="grid grid-cols-4 gap-2">
                {assetIconOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => setIcon(option.value)} title={option.label} className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${icon === option.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
                    <AssetIcon name={option.value} />{option.label}
                  </button>
                ))}
              </div>
            </div>
            <div><p className="mb-2 text-sm font-medium">Icon color</p><div className="flex flex-wrap gap-2">{iconColorOptions.map((color) => <button key={color} type="button" onClick={() => setIconColor(color)} aria-label={`Use ${color}`} className={`h-7 w-7 rounded-full border-2 ${iconColor === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div></div>


            <div className="flex justify-end gap-3">


              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  rounded-lg
                  bg-muted
                  px-4
                  py-2
                  btn-press
                "
              >
                Cancel
              </button>


              <button
                type="submit"
                className="
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-primary-foreground
                  btn-press
                "
              >
                Save
              </button>


            </div>


          </form>


        </div>

      )}


    </>
  );
}
