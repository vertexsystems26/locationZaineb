import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Tuile de synthèse : libellé, valeur, précision. La couleur n'est portée que par
 * la pastille de l'icône ; le texte reste en encre neutre.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
  valueClassName,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground",
            iconClassName,
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className={cn("mt-1 text-2xl font-semibold tracking-tight", valueClassName)}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </Card>
  );
}
