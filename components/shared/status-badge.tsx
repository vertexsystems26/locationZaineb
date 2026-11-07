import { Badge } from "@/components/ui/badge";
import { CAR_STATUS_META, CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS, RENTAL_STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CarStatus, ExpenseCategory, RentalStatus, TransactionCategory, TransactionType } from "@/types";

export function CarStatusBadge({ status, className }: { status: CarStatus; className?: string }) {
  const meta = CAR_STATUS_META[status];
  return (
    <Badge className={cn(meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function RentalStatusBadge({ status, className }: { status: RentalStatus; className?: string }) {
  const meta = RENTAL_STATUS_META[status];
  return (
    <Badge className={cn(meta.className, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

/** Catégorie : pastille colorée (identité) + libellé en encre neutre. */
export function CategoryLabel({ category, type }: { category: TransactionCategory; type: TransactionType }) {
  const color =
    type === "sortie" ? EXPENSE_CATEGORY_COLORS[category as ExpenseCategory] : "var(--color-muted-foreground)";
  const label = type === "entrée" && category === "autre" ? "Autre entrée" : CATEGORY_LABELS[category];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}
