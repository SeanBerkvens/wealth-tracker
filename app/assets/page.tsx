import { supabase } from "@/lib/supabase";
import AddAssetForm from "@/components/assets/add-asset-form";
import AssetActions from "@/components/assets/asset-actions";

export default async function AssetsPage() {

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });


  const totalValue =
    assets?.reduce(
      (total, asset) =>
        total + Number(asset.value),
      0
    ) ?? 0;


  return (
    <div className="space-y-10">


      {/* Header */}
      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-4xl font-semibold tracking-tight">
            Assets
          </h1>

          <p className="mt-2 text-muted-foreground text-lg">
            Track everything you own
          </p>

        </div>


        <AddAssetForm />

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
          Total Asset Value
        </p>


        <h2 className="mt-3 text-4xl font-semibold text-primary">
          ${totalValue.toLocaleString()}
        </h2>

      </div>



      {/* Assets */}
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
          Your Assets
        </h2>


        <div className="grid gap-4 md:grid-cols-2">


          {assets?.map((asset) => (

            <div
              key={asset.id}
              className="
                rounded-2xl
                bg-muted
                p-5
              "
            >

              <p className="font-semibold text-lg">
                {asset.name}
              </p>


              <p className="text-sm text-muted-foreground">
                {asset.category}
              </p>


              <p className="
                mt-5
                text-3xl
                font-semibold
                text-primary
              ">
                ${Number(asset.value).toLocaleString()}
              </p>
<AssetActions
  id={asset.id}
  name={asset.name}
  category={asset.category}
  value={Number(asset.value)}
/>

            </div>

          ))}


          {!assets?.length && (

            <p className="text-muted-foreground">
              No assets added yet.
            </p>

          )}


        </div>


      </div>


    </div>
  );
}