import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, carsCol } from "@/lib/firestore/collections";
import type { CarInput } from "@/types";

export async function createCar(input: CarInput): Promise<string> {
  const ref = await addDoc(carsCol(), { ...input, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateCar(id: string, input: Partial<CarInput>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.cars, id), { ...input });
}

/**
 * Supprime la voiture. L'historique (locations, transactions) est volontairement conservé
 * pour ne pas fausser les finances ; les vérifications métier sont faites avant l'appel.
 */
export async function deleteCar(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.cars, id));
}
