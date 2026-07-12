"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


export default function AddAssetForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");


  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();


    const { error } = await supabase
      .from("assets")
      .insert({
        name,
        category,
        value: Number(value),
      });


    if (error) {
      console.error(error);
      return;
    }


    setName("");
    setCategory("");
    setValue("");

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
