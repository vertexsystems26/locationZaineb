import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, transactionsCol } from "@/lib/firestore/collections";
import type { Transaction, TransactionInput } from "@/types";

const LINKED_ERROR =
  "Cette entrée est liée à une location : modifiez ou annulez la location pour la mettre à jour.";

export async function createTransaction(input: TransactionInput): Promise<string> {
  const ref = await addDoc(transactionsCol(), { ...input, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateTransaction(transaction: Transaction, input: TransactionInput): Promise<void> {
  if (transaction.rentalId) throw new Error(LINKED_ERROR);
  await updateDoc(doc(db, COLLECTIONS.transactions, transaction.id), { ...input });
}

export async function deleteTransaction(transaction: Transaction): Promise<void> {
  if (transaction.rentalId) throw new Error(LINKED_ERROR);
  await deleteDoc(doc(db, COLLECTIONS.transactions, transaction.id));
}
