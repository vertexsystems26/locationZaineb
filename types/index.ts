/** Dates « jour » stockées au format ISO `yyyy-MM-dd` (triables, sans fuseau horaire). */
export type DateKey = string;

// ---------- Voitures ----------
export const CAR_STATUSES = ["disponible", "loué", "maintenance"] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

export interface Car {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  dailyPrice: number;
  mileage: number;
  status: CarStatus;
  notes: string;
  createdAt: Date | null;
}

export type CarInput = Omit<Car, "id" | "createdAt">;

// ---------- Locations ----------
export const RENTAL_STATUSES = ["à venir", "en cours", "terminée", "annulée"] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export interface Rental {
  id: string;
  carId: string;
  carLabel: string;
  clientName: string;
  clientPhone: string;
  startDate: DateKey;
  endDate: DateKey;
  dailyPrice: number;
  days: number;
  totalPrice: number;
  status: RentalStatus;
  notes: string;
  createdAt: Date | null;
}

/** Données saisies dans le formulaire ; days/totalPrice/status sont calculés. */
export interface RentalInput {
  carId: string;
  clientName: string;
  clientPhone: string;
  startDate: DateKey;
  endDate: DateKey;
  dailyPrice: number;
  notes: string;
}

// ---------- Transactions ----------
export const TRANSACTION_TYPES = ["entrée", "sortie"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INCOME_CATEGORIES = ["location", "autre"] as const;
export const EXPENSE_CATEGORIES = [
  "vidange",
  "assurance",
  "vignette",
  "réparation",
  "carburant",
  "lavage",
  "pneus",
  "autre",
] as const;
export const TRANSACTION_CATEGORIES = [
  "location",
  "vidange",
  "assurance",
  "vignette",
  "réparation",
  "carburant",
  "lavage",
  "pneus",
  "autre",
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: DateKey;
  carId: string | null;
  rentalId: string | null;
  description: string;
  createdAt: Date | null;
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt">;
