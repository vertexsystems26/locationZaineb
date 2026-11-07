"use client";

import * as React from "react";
import type { Car, DateKey, Rental, Transaction, TransactionType } from "@/types";

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  /** Si la promesse échoue, la fenêtre reste ouverte et l'erreur est affichée en toast. */
  onConfirm: () => Promise<void> | void;
}

export interface RentalFormOptions {
  rental?: Rental;
  carId?: string;
  startDate?: DateKey;
}

export interface TransactionFormOptions {
  type: TransactionType;
  transaction?: Transaction;
  carId?: string;
}

export interface DialogsApi {
  openCarForm: (car?: Car) => void;
  openRentalForm: (options?: RentalFormOptions) => void;
  openRentalDetails: (rental: Rental) => void;
  openTransactionForm: (options: TransactionFormOptions) => void;
  confirm: (options: ConfirmOptions) => void;
}

export const DialogsContext = React.createContext<DialogsApi | null>(null);

/** Ouvre les formulaires (voiture, location, dépense…) et confirmations depuis n'importe quelle page. */
export function useDialogs(): DialogsApi {
  const context = React.useContext(DialogsContext);
  if (!context) throw new Error("useDialogs doit être utilisé à l'intérieur de <DialogsProvider>.");
  return context;
}
