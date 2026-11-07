import { COLLECTIONS, loadFirestore } from "@/lib/firestore/collections";
import type { Transaction, TransactionInput } from "@/types";

const LINKED_ERROR =
  "Cette entrée est liée à une location : modifiez ou annulez la location pour la mettre à jour.";

export async function createTransaction(input: TransactionInput): Promise<string> {
  const { sdk, db } = await loadFirestore();
  const ref = await sdk.addDoc(sdk.collection(db, COLLECTIONS.transactions), {
    ...input,
    createdAt: sdk.serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(transaction: Transaction, input: TransactionInput): Promise<void> {
  if (transaction.rentalId) throw new Error(LINKED_ERROR);
  const { sdk, db } = await loadFirestore();
  await sdk.updateDoc(sdk.doc(db, COLLECTIONS.transactions, transaction.id), { ...input });
}

export async function deleteTransaction(transaction: Transaction): Promise<void> {
  if (transaction.rentalId) throw new Error(LINKED_ERROR);
  const { sdk, db } = await loadFirestore();
  await sdk.deleteDoc(sdk.doc(db, COLLECTIONS.transactions, transaction.id));
}
