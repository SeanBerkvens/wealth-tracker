import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  variant?: "compact" | "full";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "full",
  className,
}: EmptyStateProps) {
  const compact = variant === "compact";

  return (
    <section
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-sky-500/25 bg-sky-500/[0.035] text-center dark:bg-sky-400/[0.045]",
        compact ? "min-h-44 px-5 py-7" : "min-h-80 px-6 py-12 sm:px-10",
        className
      )}
      aria-labelledby={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-empty-state`}
    >
      <div className={cn("flex items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300", compact ? "size-10" : "size-12")}>
        <Icon className={compact ? "size-5" : "size-6"} aria-hidden="true" />
      </div>
      <h2 id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-empty-state`} className={cn("mt-4 font-semibold tracking-tight text-card-foreground", compact ? "text-base" : "text-xl")}>
        {title}
      </h2>
      <p className={cn("mt-2 max-w-lg text-muted-foreground", compact ? "text-sm" : "text-sm sm:text-base")}>
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </section>
  );
}
