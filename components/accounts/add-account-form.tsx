"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


export default function AddAccountForm() {

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");


  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();


    await supabase
      .from("accounts")
      .insert({
        name,
        type,
        balance: Number(balance),
      });


    setName("");
    setType("");
    setBalance("");

    setOpen(false);

    window.location.reload();

  }


  return (
    <>

      <button
        onClick={() => setOpen(true)}
        className="
          rounded-xl
          bg-primary
          px-4
          py-2
          font-medium
          text-primary-foreground
          shadow-sm
        "
      >
        Add Account
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
            "
          >

            <h2 className="text-xl font-semibold">
              Add Account
            </h2>


            <input
              placeholder="Account Name"
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
              placeholder="Type (Chequing, Savings...)"
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              placeholder="Balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
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
                  rounded-xl
                  px-4
                  py-2
                  bg-muted
                "
              >
                Cancel
              </button>


              <button
                type="submit"
                className="
                  rounded-xl
                  bg-primary
                  px-4
                  py-2
                  text-primary-foreground
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