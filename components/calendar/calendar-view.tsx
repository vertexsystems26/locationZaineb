"use client";

import { useMemo, useState } from "react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { CalendarDays, CarFront, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RentalStatusBadge } from "@/components/shared/status-badge";
import { RentalTimeline, useCarColors } from "@/components/calendar/rental-timeline";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCars } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { capitalize, formatDate, formatPeriod, fromDateKey, toDateKey } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";
import { carLabel } from "@/lib/rental-logic";

export function CalendarView() {
  const { cars, loading: carsLoading } = useCars();
  const { rentals, loading: rentalsLoading, today } = useRentals();
  const { openRentalForm, openRentalDetails, openCarForm } = useDialogs();
  const colors = useCarColors(cars);

  const [month, setMonth] = useState(() => toDateKey(startOfMonth(fromDateKey(today))));
  const [carFilter, setCarFilter] = useState("");

  const monthEnd = toDateKey(endOfMonth(fromDateKey(month)));
  const visibleCars = carFilter ? cars.filter((c) => c.id === carFilter) : cars;

  const monthRentals = useMemo(
    () =>
      rentals
        .filter(
          (r) =>
            r.status !== "annulée" &&
            r.startDate <= monthEnd &&
            r.endDate >= month &&
            (!carFilter || r.carId === carFilter),
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [rentals, month, monthEnd, carFilter],
  );

  const shift = (amount: number) => setMonth((m) => toDateKey(addMonths(fromDateKey(m), amount)));
  const loading = carsLoading || rentalsLoading;

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Calendrier"
        description="Planning des locations par voiture."
        actions={
          <Button onClick={() => openRentalForm()}>
            <Plus />
            Nouvelle location
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mois précédent">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Mois suivant">
            <ChevronRight />
          </Button>
          <h2 className="ml-1 min-w-40 text-lg font-semibold">{capitalize(formatDate(month, "MMMM yyyy"))}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMonth(toDateKey(startOfMonth(fromDateKey(today))))}
          >
            Aujourd&apos;hui
          </Button>
        </div>
        <Select
          value={carFilter}
          onChange={(e) => setCarFilter(e.target.value)}
          className="sm:w-72"
          aria-label="Filtrer par voiture"
        >
          <option value="">Toutes les voitures ({cars.length})</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {carLabel(c)}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="grid gap-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={CarFront}
            title="Aucune voiture"
            description="Ajoutez une voiture pour afficher son planning."
            action={
              <Button onClick={() => openCarForm()}>
                <Plus />
                Ajouter une voiture
              </Button>
            }
          />
        ) : (
          <RentalTimeline cars={visibleCars} colors={colors} rentals={rentals} month={month} today={today} />
        )}
      </Card>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-sm bg-[#2a78d6]" /> En cours / à venir
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-5 rounded-sm bg-[#2a78d6] opacity-50" /> Terminée
        </span>
        <span>Une barre va du jour de départ au jour de retour · cliquez sur une case vide pour créer une location</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
              <CalendarDays className="size-[18px]" />
            </span>
            <CardTitle>
              {pluralize(monthRentals.length, "location")} en {formatDate(month, "MMMM")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {monthRentals.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune location sur ce mois.
            </p>
          ) : (
            <ul className="-mx-2 grid gap-1">
              {monthRentals.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openRentalDetails(r)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: colors.get(r.carId) ?? "#94a3b8" }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.clientName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.carLabel} · {formatPeriod(r.startDate, r.endDate)}
                      </p>
                    </div>
                    <span className="hidden text-sm font-medium tabular-nums sm:block">{formatDT(r.totalPrice)}</span>
                    <RentalStatusBadge status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
