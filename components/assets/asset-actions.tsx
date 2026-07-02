"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


interface AssetActionsProps {
  id: string;
  name: string;
  category: string;
  value: number;
}


export default function AssetActions({
  id,
  name,
  category,
  value,
}: AssetActionsProps) {

  const [editing, setEditing] = useState(false);

  const [newName, setNewName] = useState(name);
  const [newCategory, setNewCategory] = useState(category);
  const [newValue, setNewValue] = useState(
    value.toString()
  );


  async function updateAsset() {

    await supabase
      .from("assets")
      .update({
        name: newName,
        category: newCategory,
        value: Number(newValue),
      })
      .eq("id", id);


    setEditing(false);

    window.location.reload();

  }



  async function deleteAsset() {

    const confirmed = confirm(
      "Delete this asset?"
    );

    if (!confirmed) return;


    await supabase
      .from("assets")
      .delete()
      .eq("id", id);


    window.location.reload();

  }



  return (

    <>

      <div className="flex gap-2 mt-4">


        <button
          onClick={() => setEditing(true)}
          className="
            rounded-lg
            bg-background
            border
            border-border
            px-3
            py-1
            text-sm
          "
        >
          Edit
        </button>


        <button
          onClick={deleteAsset}
          className="
            rounded-lg
            bg-red-500/10
            px-3
            py-1
            text-sm
            text-red-500
          "
        >
          Delete
        </button>


      </div>



      {editing && (

        <div
          className="
            fixed
            inset-0
            flex
            items-center
            justify-center
            bg-black/40
          "
        >

          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-card
              border
              border-border
              p-6
              space-y-4
            "
          >

            <h2 className="text-xl font-semibold">
              Edit Asset
            </h2>


            <input
              value={newName}
              onChange={(e)=>setNewName(e.target.value)}
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
              value={newCategory}
              onChange={(e)=>setNewCategory(e.target.value)}
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
              type="number"
              value={newValue}
              onChange={(e)=>setNewValue(e.target.value)}
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
                onClick={() => setEditing(false)}
                className="
                  rounded-lg
                  bg-muted
                  px-4
                  py-2
                "
              >
                Cancel
              </button>


              <button
                onClick={updateAsset}
                className="
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-primary-foreground
                "
              >
                Save
              </button>


            </div>


          </div>

        </div>

      )}

    </>

  );
}