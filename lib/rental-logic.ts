/**
 * Règles métier des locations (fonctions pures, sans Firestore).
 *
 * Convention de durée : facturation par période de 24 h.
 *   - du 3 au 5 → 2 jours ; du 3 au 3 (retour le jour même) → 1 jour minimum.
 *   - Une voiture rendue le 5 peut être relouée dès le 5.
 * Pour facturer chaque jour calendaire (du 3 au 5 → 3 jours), modifiez uniquement
 * `computeDays` et `occupiedEnd` ci-dessous.
 */
import type { Car, DateKey, Rental, RentalStatus } from "@/types";
import { addDaysToKey, daysBetween, formatDate } from "@/lib/dates";
import { round3 } from "@/lib/utils";

export function computeDays(startDate: DateKey, endDate: DateKey): number {
  if (!startDate || !endDate) return 0;
  const diff = daysBetween(startDate, endDate);
  if (Number.isNaN(diff) || diff < 0) return 0;
  return Math.max(1, diff);
}

export function computeTotal(days: number, dailyPrice: number): number {
  if (!Number.isFinite(days) || !Number.isFinite(dailyPrice)) return 0;
  return round3(days * dailyPrice);
}

/** Fin (exclue) de la période d'occupation : [startDate, occupiedEnd[. */
export function occupiedEnd(startDate: DateKey, endDate: DateKey): DateKey {
  return endDate > startDate ? endDate : addDaysToKey(startDate, 1);
}

export function periodsOverlap(aStart: DateKey, aEnd: DateKey, bStart: DateKey, bEnd: DateKey): boolean {
  return aStart < occupiedEnd(bStart, bEnd) && bStart < occupiedEnd(aStart, aEnd);
}

/** Statut réel d'une location à partir de ses dates (seule « annulée » est manuelle). */
export function computeRentalStatus(
  rental: Pick<Rental, "startDate" | "endDate" | "status">,
  today: DateKey,
): RentalStatus {
  if (rental.status === "annulée") return "annulée";
  if (today < rental.startDate) return "à venir";
  if (today > rental.endDate) return "terminée";
  return "en cours";
}

export function isActiveRental(rental: Pick<Rental, "status">): boolean {
  return rental.status !== "annulée";
}

/** Locations non annulées de la même voiture qui chevauchent la période demandée. */
export function findConflicts(
  rentals: Rental[],
  period: { carId: string; startDate: DateKey; endDate: DateKey; excludeId?: string },
): Rental[] {
  if (!period.carId || !period.startDate || !period.endDate || period.endDate < period.startDate) {
    return [];
  }
  return rentals.filter(
    (r) =>
      r.carId === period.carId &&
      r.id !== period.excludeId &&
      isActiveRental(r) &&
      periodsOverlap(period.startDate, period.endDate, r.startDate, r.endDate),
  );
}

export function carLabel(car: Pick<Car, "brand" | "model" | "plate">): string {
  return `${`${car.brand} ${car.model}`.trim()} - ${car.plate}`;
}

export function carName(car: Pick<Car, "brand" | "model">): string {
  return `${car.brand} ${car.model}`.trim();
}

export class RentalOverlapError extends Error {
  constructor(public readonly conflict: Rental) {
    super(
      `Cette voiture est déjà louée du ${formatDate(conflict.startDate)} au ${formatDate(conflict.endDate)} ` +
        `(${conflict.clientName}). Choisissez d'autres dates ou une autre voiture.`,
    );
    this.name = "RentalOverlapError";
  }
}
