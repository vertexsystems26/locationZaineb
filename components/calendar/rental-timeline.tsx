"use client";

import { useMemo } from "react";
import { eachDayOfInterval, endOfMonth, format, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { useDialogs } from "@/components/providers/dialogs-context";
import { CATEGORICAL_PALETTE, RENTAL_STATUS_META, textOnPalette } from "@/lib/constants";
import { addDaysToKey, daysBetween, formatDate, fromDateKey, toDateKey } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";
import { carName, occupiedEnd } from "@/lib/rental-logic";
import { cn } from "@/lib/utils";
import type { Car, DateKey, Rental } from "@/types";

/** Couleur stable par voiture (indexée sur la flotte complète : un filtre ne repeint rien). */
export function useCarColors(cars: Car[]): Map<string, string> {
  return useMemo(
    () => new Map(cars.map((car, i) => [car.id, CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]])),
    [cars],
  );
}

interface Bar {
  rental: Rental;
  left: number;
  width: number;
  spanDays: number;
  clippedStart: boolean;
  clippedEnd: boolean;
}

/**
 * Position d'une location dans le mois, en jours (style planning hôtelier) :
 * la barre commence au milieu du jour de départ et finit au milieu du jour de retour,
 * ce qui montre clairement qu'une voiture rendue le 5 peut repartir le 5.
 */
function computeBar(rental: Rental, monthStart: DateKey, dayCount: number): Bar | null {
  const start = daysBetween(monthStart, rental.startDate) + 0.5;
  const end = daysBetween(monthStart, occupiedEnd(rental.startDate, rental.endDate)) + 0.5;
  const visibleStart = Math.max(start, 0);
  const visibleEnd = Math.min(end, dayCount);
  if (visibleEnd <= visibleStart) return null;
  return {
    rental,
    left: (visibleStart / dayCount) * 100,
    width: ((visibleEnd - visibleStart) / dayCount) * 100,
    spanDays: visibleEnd - visibleStart,
    clippedStart: start < 0,
    clippedEnd: end > dayCount,
  };
}

export function RentalTimeline({
  cars,
  colors,
  rentals,
  month,
  today,
}: {
  cars: Car[];
  colors: Map<string, string>;
  rentals: Rental[];
  /** Premier jour du mois affiché. */
  month: DateKey;
  today: DateKey;
}) {
  const { openRentalDetails, openRentalForm } = useDialogs();

  const days = useMemo(
    () => eachDayOfInterval({ start: fromDateKey(month), end: endOfMonth(fromDateKey(month)) }),
    [month],
  );
  const dayKeys = useMemo(() => days.map(toDateKey), [days]);
  const dayCount = days.length;

  const barsByCar = useMemo(() => {
    const map = new Map<string, Bar[]>();
    const monthEnd = addDaysToKey(dayKeys[dayKeys.length - 1], 1);
    for (const rental of rentals) {
      if (rental.status === "annulée" || rental.startDate > monthEnd) continue;
      const bar = computeBar(rental, month, dayCount);
      if (!bar) continue;
      const list = map.get(rental.carId) ?? [];
      list.push(bar);
      map.set(rental.carId, list);
    }
    return map;
  }, [rentals, month, dayCount, dayKeys]);

  const gridStyle = { gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto [--day:2.25rem] [--label:8rem] sm:[--label:11rem] xl:[--day:1.75rem]">
      {/* Largeur minimale : colonne voiture + une largeur par jour (défilement horizontal sur mobile) */}
      <div style={{ minWidth: `calc(var(--label) + ${dayCount} * var(--day))` }}>
        {/* En-tête des jours */}
        <div className="flex border-b">
          <div className="sticky left-0 z-20 flex w-[var(--label)] shrink-0 items-end border-r bg-card px-3 pb-2 text-xs font-medium text-muted-foreground sm:px-4">
            Voiture
          </div>
          <div className="grid flex-1" style={gridStyle}>
            {days.map((day, i) => {
              const key = dayKeys[i];
              const isToday = key === today;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center gap-0.5 border-r py-2 text-[11px] last:border-r-0",
                    isWeekend(day) && "bg-slate-50",
                  )}
                >
                  <span className="text-muted-foreground uppercase">{format(day, "EEEEE", { locale: fr })}</span>
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Une ligne par voiture */}
        {cars.map((car) => {
          const color = colors.get(car.id) ?? CATEGORICAL_PALETTE[0];
          const bars = barsByCar.get(car.id) ?? [];
          return (
            <div key={car.id} className="group flex border-b last:border-b-0">
              <div className="sticky left-0 z-20 flex w-[var(--label)] shrink-0 items-center gap-2.5 border-r bg-card px-3 py-2 sm:px-4">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{carName(car)}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{car.plate}</p>
                </div>
              </div>
              <div className="relative h-14 flex-1">
                {/* Cases cliquables : créer une location pour cette voiture à cette date */}
                <div className="absolute inset-0 grid" style={gridStyle}>
                  {days.map((day, i) => {
                    const key = dayKeys[i];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => openRentalForm({ carId: car.id, startDate: key })}
                        className={cn(
                          "cursor-pointer border-r transition-colors last:border-r-0 hover:bg-primary/5",
                          isWeekend(day) && "bg-slate-50",
                          key === today && "bg-primary/5",
                        )}
                        aria-label={`Nouvelle location ${carName(car)} le ${formatDate(key)}`}
                        title={`Nouvelle location le ${formatDate(key)}`}
                      />
                    );
                  })}
                </div>
                {/* Barres des locations */}
                {bars.map(({ rental, left, width, spanDays, clippedStart, clippedEnd }) => {
                  const label = `${rental.clientName} — ${formatDate(rental.startDate, "d MMM")} → ${formatDate(
                    rental.endDate,
                    "d MMM",
                  )} · ${pluralize(rental.days, "jour")} · ${formatDT(rental.totalPrice)} · ${RENTAL_STATUS_META[rental.status].label}`;
                  return (
                    <button
                      key={rental.id}
                      type="button"
                      onClick={() => openRentalDetails(rental)}
                      title={label}
                      aria-label={label}
                      className={cn(
                        "absolute top-2.5 bottom-2.5 z-10 flex cursor-pointer items-center overflow-hidden rounded-md px-2 text-left text-xs font-medium shadow-sm ring-2 ring-card transition-[filter] hover:brightness-110 focus-visible:ring-foreground focus-visible:outline-none",
                        clippedStart && "rounded-l-none",
                        clippedEnd && "rounded-r-none",
                        rental.status === "terminée" && "opacity-50",
                      )}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: color,
                        color: textOnPalette(color),
                      }}
                    >
                      {spanDays >= 1.8 && <span className="truncate">{rental.clientName}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
