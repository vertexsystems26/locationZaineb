"use client";

import Link from "next/link";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryLabel } from "@/components/shared/status-badge";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useTransactionActions } from "@/hooks/use-actions";
import { useCarsById } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { formatDate } from "@/lib/dates";
import { formatDT } from "@/lib/format";
import { carLabel } from "@/lib/rental-logic";
import { sum } from "@/lib/utils";
import type { Transaction } from "@/types";

export function TransactionsTable({
  transactions,
  loading,
  showCar = true,
  emptyText,
}: {
  transactions: Transaction[];
  loading?: boolean;
  showCar?: boolean;
  emptyText: string;
}) {
  const carsById = useCarsById();
  const { rentals } = useRentals();
  const { openTransactionForm, openRentalDetails } = useDialogs();
  const { requestDelete } = useTransactionActions();
  const total = sum(transactions.map((t) => t.amount));

  if (loading) {
    return (
      <div className="grid gap-2 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Catégorie</TableHead>
          {showCar && <TableHead className="hidden sm:table-cell">Voiture</TableHead>}
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead className="text-right">Montant</TableHead>
          <TableHead className="w-24 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => {
          const car = t.carId ? carsById.get(t.carId) : undefined;
          const rental = t.rentalId ? rentals.find((r) => r.id === t.rentalId) : undefined;
          return (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap tabular-nums">{formatDate(t.date, "dd/MM/yyyy")}</TableCell>
              <TableCell>
                <CategoryLabel category={t.category} type={t.type} />
                {t.description && (
                  <p className="mt-0.5 max-w-48 truncate text-xs text-muted-foreground md:hidden">{t.description}</p>
                )}
              </TableCell>
              {showCar && (
                <TableCell className="hidden sm:table-cell">
                  {car ? (
                    <Link href={`/voitures/${car.id}`} className="whitespace-nowrap hover:text-primary hover:underline">
                      {carLabel(car)}
                    </Link>
                  ) : t.carId ? (
                    <span className="text-muted-foreground">Voiture supprimée</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell" title={t.description}>
                {t.description || "—"}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                {formatDT(t.amount)}
              </TableCell>
              <TableCell className="text-right">
                {t.rentalId ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Entrée liée à une location — voir la location"
                    aria-label="Voir la location liée"
                    disabled={!rental}
                    onClick={() => rental && openRentalDetails(rental)}
                  >
                    <Link2 />
                  </Button>
                ) : (
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Modifier"
                      onClick={() => openTransactionForm({ type: t.type, transaction: t })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Supprimer"
                      className="text-muted-foreground hover:bg-rose-50 hover:text-destructive"
                      onClick={() => requestDelete(t)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={2}>Total ({transactions.length})</TableCell>
          {showCar && <TableCell className="hidden sm:table-cell" />}
          <TableCell className="hidden md:table-cell" />
          <TableCell className="text-right font-semibold whitespace-nowrap tabular-nums">{formatDT(total)}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
