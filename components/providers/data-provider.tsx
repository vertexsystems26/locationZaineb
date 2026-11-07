"use client";

import * as React from "react";
import {
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type FirestoreError,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { toast } from "sonner";
import { carsCol, rentalsCol, transactionsCol } from "@/lib/firestore/collections";
import { mapCar, mapRental, mapTransaction } from "@/lib/firestore/mappers";
import { applyStatusUpdates, computeStatusUpdates } from "@/lib/services/status-sync";
import { computeRentalStatus } from "@/lib/rental-logic";
import { todayKey } from "@/lib/dates";
import type { Car, DateKey, Rental, Transaction } from "@/types";

interface CollectionState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

export interface DataContextValue {
  cars: Car[];
  rentals: Rental[];
  transactions: Transaction[];
  loading: { cars: boolean; rentals: boolean; transactions: boolean };
  error: string | null;
  today: DateKey;
}

/** Exporté pour pouvoir injecter des données factices (tests, aperçus). */
export const DataContext = React.createContext<DataContextValue | null>(null);

function describeError(error: FirestoreError): string {
  switch (error.code) {
    case "permission-denied":
      return "Accès refusé par Firestore. Publiez les règles du fichier firestore.rules (voir README).";
    case "unavailable":
      return "Connexion à Firestore impossible. Vérifiez votre connexion internet.";
    case "failed-precondition":
      return "Firestore n'est pas activé sur ce projet. Créez la base dans la console Firebase.";
    default:
      return `Erreur Firestore : ${error.message}`;
  }
}

/** Abonnement temps réel à une collection entière (petite flotte → volume faible). */
function useLiveCollection<T>(
  getRef: () => CollectionReference<DocumentData>,
  mapper: (snap: QueryDocumentSnapshot<DocumentData>) => T,
): CollectionState<T> {
  const [state, setState] = React.useState<CollectionState<T>>({ items: [], loading: true, error: null });

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      getRef(),
      (snapshot) => setState({ items: snapshot.docs.map(mapper), loading: false, error: null }),
      (error) => {
        console.error("[firestore]", error);
        setState((prev) => ({ ...prev, loading: false, error: describeError(error) }));
      },
    );
    return unsubscribe;
  }, [getRef, mapper]);

  return state;
}

/** Date du jour, réévaluée chaque minute (les statuts basculent à minuit sans recharger). */
function useTodayKey(): DateKey {
  const [today, setToday] = React.useState<DateKey>(todayKey);
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const next = todayKey();
      setToday((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const carsState = useLiveCollection(carsCol, mapCar);
  const rentalsState = useLiveCollection(rentalsCol, mapRental);
  const transactionsState = useLiveCollection(transactionsCol, mapTransaction);
  const today = useTodayKey();

  const statusUpdates = React.useMemo(
    () => computeStatusUpdates(carsState.items, rentalsState.items, today),
    [carsState.items, rentalsState.items, today],
  );

  // Synchronisation des statuts dans Firestore (locations « en cours »/« terminée », voiture « loué »).
  const syncing = React.useRef(false);
  const [syncRound, setSyncRound] = React.useState(0);
  React.useEffect(() => {
    if (carsState.loading || rentalsState.loading || carsState.error || rentalsState.error) return;
    if (!statusUpdates.cars.length && !statusUpdates.rentals.length) return;
    if (syncing.current) return;
    syncing.current = true;
    applyStatusUpdates(statusUpdates)
      .then(() => {
        syncing.current = false;
        setSyncRound((n) => n + 1); // revérifie si des données sont arrivées pendant l'écriture
      })
      .catch((error) => {
        syncing.current = false;
        console.error("[status-sync]", error);
      });
  }, [statusUpdates, syncRound, carsState.loading, rentalsState.loading, carsState.error, rentalsState.error]);

  // Valeurs exposées : statuts déjà corrigés en mémoire, sans attendre l'écriture Firestore.
  const cars = React.useMemo(() => {
    const overrides = new Map(statusUpdates.cars.map((u) => [u.id, u.status]));
    return carsState.items
      .map((car) => (overrides.has(car.id) ? { ...car, status: overrides.get(car.id)! } : car))
      .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "fr"));
  }, [carsState.items, statusUpdates.cars]);

  const rentals = React.useMemo(
    () =>
      rentalsState.items
        .map((r) => ({ ...r, status: computeRentalStatus(r, today) }))
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [rentalsState.items, today],
  );

  const transactions = React.useMemo(
    () =>
      [...transactionsState.items].sort(
        (a, b) => b.date.localeCompare(a.date) || (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      ),
    [transactionsState.items],
  );

  const error = carsState.error ?? rentalsState.error ?? transactionsState.error;
  React.useEffect(() => {
    if (error) toast.error(error, { id: "firestore-error", duration: 10_000 });
  }, [error]);

  const value = React.useMemo<DataContextValue>(
    () => ({
      cars,
      rentals,
      transactions,
      loading: {
        cars: carsState.loading,
        rentals: rentalsState.loading,
        transactions: transactionsState.loading,
      },
      error,
      today,
    }),
    [cars, rentals, transactions, carsState.loading, rentalsState.loading, transactionsState.loading, error, today],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = React.useContext(DataContext);
  if (!context) throw new Error("useData doit être utilisé à l'intérieur de <DataProvider>.");
  return context;
}
