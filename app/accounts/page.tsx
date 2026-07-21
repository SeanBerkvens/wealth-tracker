import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddAccountForm from "@/components/accounts/add-account-form";
import AccountActions from "@/components/accounts/account-actions";

export default async function AccountsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });


  const totalBalance =
    accounts?.reduce(
      (total, account) =>
        total + Number(account.balance),
      0
    ) ?? 0;


  return (
    <div className="space-y-10">


      {/* Header */}
      <div className="flex items-start justify-between">

  <div>

    <h1 className="text-4xl font-semibold tracking-tight">
      Accounts
    </h1>

    <p className="mt-2 text-muted-foreground text-lg">
      Manage your financial accounts
    </p>

  </div>


  <AddAccountForm />

</div>



      {/* Summary */}
      <div
        className="
          rounded-2xl
          bg-card
          border
          border-border
          p-6
          shadow-sm
        "
      >

        <p className="text-sm text-muted-foreground">
          Total Cash Balance
        </p>


        <h2 className="mt-3 text-4xl font-semibold text-primary">
          ${totalBalance.toLocaleString()}
        </h2>

      </div>



      {/* Accounts List */}
<div
  className="
    rounded-2xl
    bg-card
    border
    border-border
    p-6
    shadow-sm
  "
>

  <h2 className="text-xl font-semibold mb-6">
    Your Accounts
  </h2>


  <div className="grid gap-4 md:grid-cols-2">


    {accounts?.map((account) => (

      <div
        key={account.id}
        className="
          rounded-2xl
          bg-muted
          p-5
        "
      >

        <div className="flex justify-between items-start">


          <div>

            <p className="font-semibold text-lg">
              {account.name}
            </p>


            <p className="text-sm text-muted-foreground">
              {account.type}
            </p>

          </div>


          <div
            className="
              rounded-xl
              bg-card
              px-3
              py-1
              text-sm
            "
          >
            Active
          </div>


        </div>


        <p className="
          mt-5
          text-3xl
          font-semibold
          text-primary
        ">
          ${Number(account.balance).toLocaleString()}
        </p>
<AccountActions
  id={account.id}
  name={account.name}
  type={account.type}
  balance={Number(account.balance)}
/>

      </div>

    ))}


  </div>


</div>


    </div>
  );
}