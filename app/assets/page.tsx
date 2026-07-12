import { supabase } from "@/lib/supabase";
import AddAssetForm from "@/components/assets/add-asset-form";
import AssetItem from "@/components/assets/asset-item";
import SyncedItem from "@/components/assets/synced-item";
import UnassignedInvestmentsItem from "@/components/assets/unassigned-investments-item";
import SummaryCard from "@/components/assets/summary-card";
import AddLiabilityForm from "@/components/liabilities/add-liability-form";
import LiabilityItem from "@/components/liabilities/liability-item";

export default async function AssetsPage() {
  const [{ data: assets }, { data: liabilities }, { data: investments }, { data: portfolios }, { data: accounts }] = await Promise.all([
    supabase.from("assets").select("*").order("created_at", { ascending: false }),
    supabase
      .from("liabilities")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("investments").select("portfolio, value, is_ignored"),
    supabase.from("portfolios").select("id, name, is_ignored").order("name", { ascending: true }),
    supabase.from("accounts").select("id, name, type, balance, is_ignored").order("created_at", { ascending: false }),
  ]);

  const totalManualAssets =
    assets?.filter((asset) => !asset.is_ignored).reduce((total, asset) => total + Number(asset.value), 0) ?? 0;
  const portfolioAssets = (portfolios ?? []).map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    isIgnored: portfolio.is_ignored,
    value:
      investments
        ?.filter((investment) => investment.portfolio === portfolio.name && !investment.is_ignored)
        .reduce((total, investment) => total + Number(investment.value), 0) ?? 0,
  }));
  const unassignedInvestments = investments?.filter((investment) => !investment.portfolio) ?? [];
  const unassignedPortfolioValue =
    unassignedInvestments
      .filter((investment) => !investment.is_ignored)
      .reduce((total, investment) => total + Number(investment.value), 0) ?? 0;
  const hasUnassignedInvestments = unassignedInvestments.length > 0;
  const unassignedInvestmentsIgnored =
    hasUnassignedInvestments && unassignedInvestments.every((investment) => investment.is_ignored);
  const investmentAssetCount = portfolioAssets.length + (hasUnassignedInvestments ? 1 : 0);
  const portfolioValue = portfolioAssets.reduce(
    (total, portfolio) => total + (portfolio.isIgnored ? 0 : portfolio.value),
    unassignedPortfolioValue
  );
  const accountAssets = (accounts ?? []).filter((account) => Number(account.balance) >= 0);
  const accountLiabilities = (accounts ?? []).filter((account) => Number(account.balance) < 0);
  const totalAccountAssets = accountAssets
    .filter((account) => !account.is_ignored)
    .reduce((total, account) => total + Number(account.balance), 0);
  const totalAccountLiabilities = accountLiabilities.reduce(
    (total, account) => total + (account.is_ignored ? 0 : Math.abs(Number(account.balance))),
    0
  );
  const totalAssets = totalManualAssets + portfolioValue + totalAccountAssets;
  const totalManualLiabilities =
    liabilities
      ?.filter((liability) => !liability.is_ignored)
      .reduce((total, liability) => total + Number(liability.value), 0) ?? 0;
  const totalLiabilities = totalManualLiabilities + totalAccountLiabilities;
  const netAssetValue = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Assets &amp; Liabilities</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Keep a complete picture of what you own and owe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddLiabilityForm />
          <AddAssetForm />
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total Assets" value={totalAssets} />
        <SummaryCard label="Total Liabilities" value={totalLiabilities} />
        <SummaryCard
          label="Net Asset Value"
          value={netAssetValue}
          valueClassName={
            netAssetValue >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="text-xl font-semibold">Your Assets</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {(assets?.length ?? 0) + investmentAssetCount + accountAssets.length} item{(assets?.length ?? 0) + investmentAssetCount + accountAssets.length === 1 ? "" : "s"}
              </p>
            </div>
            <AddAssetForm compact />
          </div>
          <div className="space-y-3 p-5">
            {portfolioAssets.map((portfolio) => (
              <SyncedItem
                key={portfolio.id}
                id={portfolio.id}
                table="portfolios"
                name={portfolio.name}
                description="Synced from your investments"
                value={portfolio.value}
                isIgnored={portfolio.isIgnored ?? false}
              />
            ))}
            {hasUnassignedInvestments && (
              <UnassignedInvestmentsItem value={unassignedPortfolioValue} isIgnored={unassignedInvestmentsIgnored} />
            )}
            {accountAssets.map((account) => (
              <SyncedItem
                key={account.id}
                id={account.id}
                table="accounts"
                name={account.name}
                description={`${account.type} account · Synced from your accounts`}
                value={Number(account.balance)}
                isIgnored={account.is_ignored ?? false}
              />
            ))}
            {assets?.map((asset) => <AssetItem key={asset.id} asset={asset} />)}
            {!assets?.length && !investmentAssetCount && !accountAssets.length && <EmptyState message="No assets added yet." />}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="text-xl font-semibold">Your Liabilities</h2>
              <p className="mt-1 text-sm text-muted-foreground">{(liabilities?.length ?? 0) + accountLiabilities.length} item{(liabilities?.length ?? 0) + accountLiabilities.length === 1 ? "" : "s"}</p>
            </div>
            <AddLiabilityForm compact />
          </div>
          <div className="space-y-3 p-5">
            {accountLiabilities.map((account) => (
              <SyncedItem
                key={account.id}
                id={account.id}
                table="accounts"
                name={account.name}
                description={`${account.type} account · Synced from your accounts`}
                value={Math.abs(Number(account.balance))}
                isIgnored={account.is_ignored ?? false}
                liability
              />
            ))}
            {liabilities?.map((liability) => <LiabilityItem key={liability.id} liability={liability} />)}
            {!liabilities?.length && !accountLiabilities.length && <EmptyState message="No liabilities added yet." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{message}</p>;
}
