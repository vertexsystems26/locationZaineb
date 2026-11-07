import { COLLECTIONS, loadFirestore } from "@/lib/firestore/collections";
import { computeRentalStatus } from "@/lib/rental-logic";
import type { Car, CarStatus, DateKey, Rental, RentalStatus } from "@/types";

export interface StatusUpdates {
  rentals: { id: string; status: RentalStatus }[];
  cars: { id: string; status: CarStatus }[];
}

/**
 * Calcule les statuts à corriger :
 *  - location : « à venir » / « en cours » / « terminée » selon la date du jour (sauf « annulée ») ;
 *  - voiture : « loué » si une location est en cours aujourd'hui, sinon « disponible »
 *    (une voiture en « maintenance » sans location en cours reste en maintenance).
 */
export function computeStatusUpdates(cars: Car[], rentals: Rental[], today: DateKey): StatusUpdates {
  const rentalUpdates: StatusUpdates["rentals"] = [];
  const rentedCarIds = new Set<string>();

  for (const rental of rentals) {
    if (!rental.startDate || !rental.endDate) continue;
    const status = computeRentalStatus(rental, today);
    if (status !== rental.status) rentalUpdates.push({ id: rental.id, status });
    if (status === "en cours") rentedCarIds.add(rental.carId);
  }

  const carUpdates: StatusUpdates["cars"] = [];
  for (const car of cars) {
    const status: CarStatus = rentedCarIds.has(car.id)
      ? "loué"
      : car.status === "loué"
        ? "disponible"
        : car.status;
    if (status !== car.status) carUpdates.push({ id: car.id, status });
  }

  return { rentals: rentalUpdates, cars: carUpdates };
}

export async function applyStatusUpdates(updates: StatusUpdates): Promise<void> {
  const { sdk, db } = await loadFirestore();
  // Un batch Firestore accepte 500 écritures : largement suffisant pour une petite flotte,
  // mais on découpe par sécurité.
  const writes = [
    ...updates.rentals.map((u) => ({ path: COLLECTIONS.rentals, ...u })),
    ...updates.cars.map((u) => ({ path: COLLECTIONS.cars, ...u })),
  ];
  for (let i = 0; i < writes.length; i += 450) {
    const batch = sdk.writeBatch(db);
    for (const w of writes.slice(i, i + 450)) {
      batch.update(sdk.doc(db, w.path, w.id), { status: w.status });
    }
    await batch.commit();
  }
}
