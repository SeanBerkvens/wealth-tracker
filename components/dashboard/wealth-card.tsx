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
        transition-all
        duration-300
        ease-out
        border
        border-border
        card-hover
        ${
          featured
            ? `
              bg-gradient-to-br
              from-card
              via-card
              to-primary/20
              shadow-lg
              hover:shadow-xl
              hover:border-primary/20
            `
            : `
              bg-card
              shadow-sm
              hover:shadow-md
              hover:border-primary/10
            `
        }
      `}
    >

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-muted-foreground font-medium">
            {title}
          </p>

          <h2
            className={`
              mt-3
              font-semibold
              tracking-tight
              text-card-foreground
              ${featured ? "text-5xl md:text-6xl" : "text-3xl"}
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


        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-muted
            shadow-sm
            transition-all
            duration-200
            group-hover:scale-110
          "
        >
          <Icon
            size={20}
            className="text-primary"
          />
        </div>


      </div>

    </div>
  );
}