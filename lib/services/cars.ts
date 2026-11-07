import { COLLECTIONS, loadFirestore } from "@/lib/firestore/collections";
import type { CarInput } from "@/types";

export async function createCar(input: CarInput): Promise<string> {
  const { sdk, db } = await loadFirestore();
  const ref = await sdk.addDoc(sdk.collection(db, COLLECTIONS.cars), {
    ...input,
    createdAt: sdk.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCar(id: string, input: Partial<CarInput>): Promise<void> {
  const { sdk, db } = await loadFirestore();
  await sdk.updateDoc(sdk.doc(db, COLLECTIONS.cars, id), { ...input });
}

/**
 * Supprime la voiture. L'historique (locations, transactions) est volontairement conservé
 * pour ne pas fausser les finances ; les vérifications métier sont faites avant l'appel.
 */
export async function deleteCar(id: string): Promise<void> {
  const { sdk, db } = await loadFirestore();
  await sdk.deleteDoc(sdk.doc(db, COLLECTIONS.cars, id));
}
