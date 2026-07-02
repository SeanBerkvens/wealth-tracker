import { supabase } from "@/lib/supabase";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import InvestmentActions from "@/components/investments/investment-actions";
import PriceRefresh from "@/components/investments/price-refresh";


export default async function InvestmentsPage() {


  const { data: investments } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });



  const totalValue =
    investments?.reduce(
      (total, investment) =>
        total + Number(investment.value),
      0
    ) ?? 0;



  return (

    <div className="space-y-10">


      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-4xl font-semibold tracking-tight">
            Investments
          </h1>


          <p className="mt-2 text-muted-foreground text-lg">
            Track your portfolio holdings
          </p>

        </div>


        <PriceRefresh />

      </div>





      {/* Portfolio Summary */}

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
          Portfolio Value
        </p>


        <h2
          className="
            mt-3
            text-4xl
            font-semibold
            text-primary
          "
        >
          ${totalValue.toLocaleString()}
        </h2>


      </div>





      {/* Holdings Table */}

      <div
        className="
          rounded-2xl
          bg-card
          border
          border-border
          p-6
          shadow-sm
          overflow-x-auto
        "
      >


        <div className="flex items-center gap-3 mb-6">

  <h2 className="text-xl font-semibold">
    Holdings
  </h2>


  <AddInvestmentForm />

</div>





        <table className="w-full text-sm">


          <thead>

            <tr
              className="
                border-b
                border-border
                text-muted-foreground
              "
            >

              <th className="text-left py-3">
                Symbol
              </th>

              <th className="text-left py-3">
                Name
              </th>

              <th className="text-right py-3">
                Shares
              </th>

              <th className="text-right py-3">
                Cost
              </th>

              <th className="text-right py-3">
                Current Price
              </th>

              <th className="text-right py-3">
                Value
              </th>

              <th className="text-right py-3">
                Gain/Loss
              </th>

              <th className="text-right py-3">
                Return
              </th>

              <th className="text-right py-3">
                Actions
              </th>

            </tr>

          </thead>




          <tbody>


            {investments?.map((investment) => {


              const cost =
                Number(investment.shares) *
                Number(investment.purchase_price);



              const gain =
                Number(investment.value) -
                cost;



              const gainPercent =
                cost !== 0
                  ? (gain / cost) * 100
                  : 0;




              return (

                <tr
                  key={investment.id}
                  className="
                    border-b
                    border-border
                    last:border-none
                  "
                >


                  <td className="py-4 font-semibold">
                    {investment.symbol}
                  </td>



                  <td className="py-4">
                    {investment.name}
                  </td>



                  <td className="py-4 text-right">
                    {investment.shares}
                  </td>



                  <td className="py-4 text-right">
                    ${cost.toLocaleString()}
                  </td>



                  <td className="py-4 text-right">
                    ${Number(investment.current_price).toLocaleString()}
                  </td>



                  <td className="py-4 text-right font-semibold">
                    ${Number(investment.value).toLocaleString()}
                  </td>



                  <td
                    className={`
                      py-4
                      text-right
                      font-semibold

                      ${
                        gain >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    `}
                  >

                    {gain >= 0 ? "+" : ""}
                    ${gain.toLocaleString()}

                  </td>




                  <td
                    className={`
                      py-4
                      text-right

                      ${
                        gainPercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    `}
                  >

                    {gainPercent.toFixed(2)}%

                  </td>




                  <td className="py-4 text-right">

                    <div className="flex justify-end">

                      <InvestmentActions
                        id={investment.id}
                        name={investment.name}
                        symbol={investment.symbol}
                        shares={Number(investment.shares)}
                        purchasePrice={Number(investment.purchase_price)}
                        currentPrice={Number(investment.current_price)}
                      />

                    </div>

                  </td>



                </tr>

              );


            })}



          </tbody>


        </table>





        {!investments?.length && (

          <p className="text-muted-foreground mt-4">
            No investments added yet.
          </p>

        )}



      </div>


    </div>

  );

}