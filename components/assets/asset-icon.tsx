import { BriefcaseBusiness, Car, CircleDollarSign, Gem, House, Landmark, Package, Sailboat, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const assetIconOptions: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "house", label: "Home", icon: House }, { value: "car", label: "Vehicle", icon: Car },
  { value: "boat", label: "Boat", icon: Sailboat },
  { value: "wallet", label: "Cash", icon: Wallet }, { value: "landmark", label: "Bank", icon: Landmark },
  { value: "trending-up", label: "Investment", icon: TrendingUp }, { value: "gem", label: "Valuable", icon: Gem },
  { value: "briefcase", label: "Business", icon: BriefcaseBusiness }, { value: "package", label: "Other", icon: Package },
];

export const iconColorOptions = ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#22c55e", "#64748b"];

export function AssetIcon({ name = "wallet", color, className = "h-5 w-5" }: { name?: string | null; color?: string | null; className?: string }) {
  const Icon = assetIconOptions.find((option) => option.value === name)?.icon ?? CircleDollarSign;
  return <Icon className={className} style={color ? { color } : undefined} aria-hidden="true" />;
}
