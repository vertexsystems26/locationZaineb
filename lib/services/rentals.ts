import { doc, getDocs, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, rentalTransactionRef, rentalsCol } from "@/lib/firestore/collections";
import { mapRental } from "@/lib/firestore/mappers";
import { todayKey } from "@/lib/dates";
import {
  RentalOverlapError,
  computeDays,
  computeRentalStatus,
  computeTotal,
  findConflicts,
} from "@/lib/rental-logic";
import type { Rental, RentalInput, TransactionInput } from "@/types";

type RentalData = Omit<Rental, "id" | "createdAt">;

function buildRentalData(input: RentalInput, carLabel: string): RentalData {
  const days = computeDays(input.startDate, input.endDate);
  const totalPrice = computeTotal(days, input.dailyPrice);
  const data = {
    carId: input.carId,
    carLabel,
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    dailyPrice: input.dailyPrice,
    days,
    totalPrice,
    notes: input.notes.trim(),
  };
  return { ...data, status: computeRentalStatus({ ...data, status: "à venir" }, todayKey()) };
}

function buildIncomeTransaction(rentalId: string, data: RentalData): TransactionInput {
  return {
    type: "entrée",
    category: "location",
    amount: data.totalPrice,
    date: data.startDate,
    carId: data.carId,
    rentalId,
    description: `Location — ${data.clientName} (${data.carLabel})`,
  };
}

/**
 * Vérifie l'absence de chevauchement à partir des données fraîches du serveur
 * (en plus de la vérification en direct faite dans le formulaire).
 */
async function assertNoOverlap(input: RentalInput, excludeId?: string): Promise<void> {
  const snap = await getDocs(query(rentalsCol(), where("carId", "==", input.carId)));
  const conflicts = findConflicts(snap.docs.map(mapRental), { ...input, excludeId });
  if (conflicts.length) throw new RentalOverlapError(conflicts[0]);
}

/** Crée la location ET sa transaction « entrée » dans une seule opération atomique. */
export async function createRental(input: RentalInput, carLabel: string): Promise<string> {
  await assertNoOverlap(input);
  const rentalRef = doc(rentalsCol());
  const data = buildRentalData(input, carLabel);

  const batch = writeBatch(db);
  batch.set(rentalRef, { ...data, createdAt: serverTimestamp() });
  batch.set(rentalTransactionRef(rentalRef.id), {
    ...buildIncomeTransaction(rentalRef.id, data),
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return rentalRef.id;
}

/** Met à jour la location et resynchronise la transaction liée (montant, date, voiture). */
export async function updateRental(id: string, input: RentalInput, carLabel: string): Promise<void> {
  await assertNoOverlap(input, id);
  const data = buildRentalData(input, carLabel);

  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.rentals, id), { ...data });
  // merge : recrée la transaction si elle avait été supprimée, conserve son createdAt sinon.
  batch.set(rentalTransactionRef(id), buildIncomeTransaction(id, data), { merge: true });
  await batch.commit();
}

/** Annule la location : l'argent n'est plus attendu, la transaction liée est supprimée. */
export async function cancelRental(id: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.rentals, id), { status: "annulée" });
  batch.delete(rentalTransactionRef(id));
  await batch.commit();
}

export async function deleteRental(id: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.rentals, id));
  batch.delete(rentalTransactionRef(id));
  await batch.commit();
}
