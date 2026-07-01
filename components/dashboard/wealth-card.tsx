import {
  TrendingUp,
  Home,
  CreditCard,
  Wallet,
  PiggyBank,
} from "lucide-react";


interface WealthCardProps {
  title: string;
  value: string;
  change?: string;
  icon: "trend" | "home" | "card" | "wallet" | "piggy";
  featured?: boolean;
}


const icons = {
  trend: TrendingUp,
  home: Home,
  card: CreditCard,
  wallet: Wallet,
  piggy: PiggyBank,
};


export default function WealthCard({
  title,
  value,
  change,
  icon,
  featured = false,
}: WealthCardProps) {

  const Icon = icons[icon];

  return (
    <div
  className={`
    rounded-2xl
    p-6
    shadow-sm
    transition-all
    ${
      featured
        ? "bg-gradient-to-b from-neutral-50 to-white border border-[#D4AF37]/30 shadow-md"
        : "bg-gradient-to-b from-neutral-50 to-neutral-200"
    }
  `}
>

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-neutral-500">
            {title}
          </p>

          <h2
  className={`
    mt-3
    font-semibold
    tracking-tight
    ${featured ? "text-5xl" : "text-3xl"}
  `}
>
            {value}
          </h2>

          {change && (
            <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />

              <span>
                {change}
              </span>
            </div>
          )}

        </div>


        <div className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-white
          shadow-sm
        ">
          <Icon
            size={20}
            className="text-[#D4AF37]"
          />
        </div>

      </div>

    </div>
  );
}