"use client";


const transactions = [
  {
    name: "Paycheque",
    category: "Income",
    amount: "+$2,500",
  },
  {
    name: "Groceries",
    category: "Expense",
    amount: "-$150",
  },
  {
    name: "Dividend",
    category: "Investment",
    amount: "+$45",
  },
  {
    name: "Gas",
    category: "Expense",
    amount: "-$80",
  },
];


export function RecentTransactions() {
  return (
    <div
      className="
        rounded-2xl
        bg-white
        p-6
        shadow-sm
      "
    >

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Recent Activity
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Latest changes to your finances
        </p>

      </div>


      {/* Transactions */}
      <div className="space-y-3">

        {transactions.map((transaction) => (

          <div
            key={transaction.name}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              bg-neutral-50
              p-4
            "
          >

            <div>

              <p className="font-medium">
                {transaction.name}
              </p>

              <p className="text-sm text-neutral-500">
                {transaction.category}
              </p>

            </div>


            <p
              className={`
                font-semibold
                ${
                  transaction.amount.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                }
              `}
            >
              {transaction.amount}
            </p>


          </div>

        ))}

      </div>


    </div>
  );
}