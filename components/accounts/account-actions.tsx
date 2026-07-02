"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


interface AccountActionsProps {
  id: string;
  name: string;
  type: string;
  balance: number;
}


export default function AccountActions({
  id,
  name,
  type,
  balance,
}: AccountActionsProps) {

  const [editing, setEditing] = useState(false);

  const [newName, setNewName] = useState(name);
  const [newType, setNewType] = useState(type);
  const [newBalance, setNewBalance] = useState(
    balance.toString()
  );


  async function updateAccount() {

    await supabase
      .from("accounts")
      .update({
        name: newName,
        type: newType,
        balance: Number(newBalance),
      })
      .eq("id", id);


    setEditing(false);

    window.location.reload();

  }



  async function deleteAccount() {

    const confirmed = confirm(
      "Delete this account?"
    );

    if (!confirmed) return;


    await supabase
      .from("accounts")
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
            px-3
            py-1
            text-sm
            border
            border-border
          "
        >
          Edit
        </button>


        <button
          onClick={deleteAccount}
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
              Edit Account
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
              value={newType}
              onChange={(e)=>setNewType(e.target.value)}
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
              value={newBalance}
              onChange={(e)=>setNewBalance(e.target.value)}
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
                onClick={updateAccount}
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