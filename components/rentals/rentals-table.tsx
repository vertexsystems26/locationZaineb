"use client";

import { Ban, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RentalStatusBadge } from "@/components/shared/status-badge";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useRentalActions } from "@/hooks/use-actions";
import { formatPeriod } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Rental } from "@/types";

export function RentalsTable({
  rentals,
  loading,
  showCar = true,
  emptyText,
}: {
  rentals: Rental[];
  loading?: boolean;
  showCar?: boolean;
  emptyText: string;
}) {
  const { openRentalDetails, openRentalForm } = useDialogs();
  const { requestCancel, requestDelete } = useRentalActions();

  if (loading) {
    return (
      <div className="grid gap-2 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rentals.length) {
    return <p className="px-5 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <>
      {/* Mobile : cartes */}
      <ul className="divide-y md:hidden">
        {rentals.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => openRentalDetails(r)}
              className={cn(
                "flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/60",
                r.status === "annulée" && "opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.clientName}</p>
                {showCar && <p className="truncate text-sm text-muted-foreground">{r.carLabel}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatPeriod(r.startDate, r.endDate)} · {pluralize(r.days, "jour")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-semibold tabular-nums">{formatDT(r.totalPrice)}</span>
                <RentalStatusBadge status={r.status} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Ordinateur : tableau */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              {showCar && <TableHead>Voiture</TableHead>}
              <TableHead>Période</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Prix/jour</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((r) => {
              const active = r.status === "à venir" || r.status === "en cours";
              return (
                <TableRow
                  key={r.id}
                  className={cn("cursor-pointer", r.status === "annulée" && "text-muted-foreground")}
                  onClick={() => openRentalDetails(r)}
                >
                  <TableCell className="whitespace-nowrap">
                    <p className="font-medium text-foreground">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">{r.clientPhone}</p>
                  </TableCell>
                  {showCar && <TableCell className="max-w-56 truncate">{r.carLabel}</TableCell>}
                  <TableCell className="whitespace-nowrap">
                    <p>{formatPeriod(r.startDate, r.endDate)}</p>
                    <p className="text-xs text-muted-foreground">{pluralize(r.days, "jour")}</p>
                  </TableCell>
                  <TableCell className="hidden text-right whitespace-nowrap tabular-nums lg:table-cell">
                    {formatDT(r.dailyPrice)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium whitespace-nowrap tabular-nums",
                      r.status === "annulée" && "line-through",
                    )}
                  >
                    {formatDT(r.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <RentalStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon-sm" aria-label="Détails" onClick={() => openRentalDetails(r)}>
                        <Eye />
                      </Button>
                      {r.status !== "annulée" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Modifier"
                          onClick={() => openRentalForm({ rental: r })}
                        >
                          <Pencil />
                        </Button>
                      )}
                      {active && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Annuler la location"
                          title="Annuler la location"
                          onClick={() => requestCancel(r)}
                        >
                          <Ban />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Supprimer"
                        className="text-muted-foreground hover:bg-rose-50 hover:text-destructive"
                        onClick={() => requestDelete(r)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
