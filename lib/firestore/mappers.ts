import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import {
  CAR_STATUSES,
  RENTAL_STATUSES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  type Car,
  type CarStatus,
  type DateKey,
  type Rental,
  type RentalStatus,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from "@/types";
import { isDateKey, toDateKey } from "@/lib/dates";

// Conversions tolérantes : un document modifié à la main dans la console ne casse pas l'interface.
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const optionalId = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

function oneOf<T extends string>(values: readonly T[], v: unknown, fallback: T): T {
  return values.includes(v as T) ? (v as T) : fallback;
}

/** Timestamp Firestore détecté sans importer le SDK (chargé uniquement dans le navigateur). */
function isTimestamp(v: unknown): v is { toDate: () => Date } {
  return typeof v === "object" && v !== null && typeof (v as { toDate?: unknown }).toDate === "function";
}

function toDate(v: unknown): Date | null {
  if (isTimestamp(v)) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

function toKey(v: unknown): DateKey {
  if (isTimestamp(v)) return toDateKey(v.toDate());
  if (v instanceof Date) return toDateKey(v);
  if (typeof v === "string") {
    const key = v.slice(0, 10);
    if (isDateKey(key)) return key;
  }
  return "";
}

const read = (snap: QueryDocumentSnapshot<DocumentData>) => snap.data({ serverTimestamps: "estimate" });

export function mapCar(snap: QueryDocumentSnapshot<DocumentData>): Car {
  const d = read(snap);
  return {
    id: snap.id,
    brand: str(d.brand),
    model: str(d.model),
    plate: str(d.plate),
    year: num(d.year),
    color: str(d.color),
    dailyPrice: num(d.dailyPrice),
    mileage: num(d.mileage),
    status: oneOf<CarStatus>(CAR_STATUSES, d.status, "disponible"),
    notes: str(d.notes),
    createdAt: toDate(d.createdAt),
  };
}

export function mapRental(snap: QueryDocumentSnapshot<DocumentData>): Rental {
  const d = read(snap);
  return {
    id: snap.id,
    carId: str(d.carId),
    carLabel: str(d.carLabel),
    clientName: str(d.clientName),
    clientPhone: str(d.clientPhone),
    startDate: toKey(d.startDate),
    endDate: toKey(d.endDate),
    dailyPrice: num(d.dailyPrice),
    days: num(d.days),
    totalPrice: num(d.totalPrice),
    status: oneOf<RentalStatus>(RENTAL_STATUSES, d.status, "à venir"),
    notes: str(d.notes),
    createdAt: toDate(d.createdAt),
  };
}

export function mapTransaction(snap: QueryDocumentSnapshot<DocumentData>): Transaction {
  const d = read(snap);
  return {
    id: snap.id,
    type: oneOf<TransactionType>(TRANSACTION_TYPES, d.type, "sortie"),
    category: oneOf<TransactionCategory>(TRANSACTION_CATEGORIES, d.category, "autre"),
    amount: num(d.amount),
    date: toKey(d.date),
    carId: optionalId(d.carId),
    rentalId: optionalId(d.rentalId),
    description: str(d.description),
    createdAt: toDate(d.createdAt),
  };
}
