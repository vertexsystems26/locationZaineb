import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const COLLECTIONS = {
  cars: "cars",
  rentals: "rentals",
  transactions: "transactions",
} as const;

export const carsCol = () => collection(db, COLLECTIONS.cars);
export const rentalsCol = () => collection(db, COLLECTIONS.rentals);
export const transactionsCol = () => collection(db, COLLECTIONS.transactions);

/**
 * La transaction « entrée » d'une location a un identifiant déterministe :
 * liaison 1↔1 garantie, mise à jour / suppression sans requête supplémentaire.
 */
export const rentalTransactionRef = (rentalId: string) =>
  doc(db, COLLECTIONS.transactions, `rental_${rentalId}`);
