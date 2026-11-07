"use client";

import * as React from "react";
import { CarFormDialog } from "@/components/cars/car-form-dialog";
import { RentalFormDialog } from "@/components/rentals/rental-form-dialog";
import { RentalDetailsDialog } from "@/components/rentals/rental-details-dialog";
import { TransactionFormDialog } from "@/components/finances/transaction-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DialogsContext,
  type ConfirmOptions,
  type DialogsApi,
  type RentalFormOptions,
  type TransactionFormOptions,
} from "@/components/providers/dialogs-context";
import type { Car } from "@/types";

/**
 * État d'une fenêtre : les options restent en mémoire après fermeture (pas de « flash »
 * pendant l'animation) ; `key` change à chaque ouverture pour réinitialiser le formulaire.
 */
interface DialogState<T> {
  open: boolean;
  key: number;
  options: T;
}

function useDialogState<T>(initial: T) {
  const [state, setState] = React.useState<DialogState<T>>({ open: false, key: 0, options: initial });
  const show = React.useCallback((options: T) => {
    setState((prev) => ({ open: true, key: prev.key + 1, options }));
  }, []);
  const setOpen = React.useCallback((open: boolean) => setState((prev) => ({ ...prev, open })), []);
  return [state, show, setOpen] as const;
}

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [carForm, showCarForm, setCarFormOpen] = useDialogState<Car | undefined>(undefined);
  const [rentalForm, showRentalForm, setRentalFormOpen] = useDialogState<RentalFormOptions>({});
  const [rentalDetails, showRentalDetails, setRentalDetailsOpen] = useDialogState<string | null>(null);
  const [txForm, showTxForm, setTxFormOpen] = useDialogState<TransactionFormOptions>({ type: "sortie" });
  const [confirmState, showConfirm, setConfirmOpen] = useDialogState<ConfirmOptions | null>(null);

  const api = React.useMemo<DialogsApi>(
    () => ({
      openCarForm: (car) => showCarForm(car),
      openRentalForm: (options) => showRentalForm(options ?? {}),
      openRentalDetails: (rental) => showRentalDetails(rental.id),
      openTransactionForm: (options) => showTxForm(options),
      confirm: (options) => showConfirm(options),
    }),
    [showCarForm, showRentalForm, showRentalDetails, showTxForm, showConfirm],
  );

  return (
    <DialogsContext.Provider value={api}>
      {children}
      <CarFormDialog
        open={carForm.open}
        onOpenChange={setCarFormOpen}
        car={carForm.options}
        formKey={carForm.key}
      />
      <RentalFormDialog
        open={rentalForm.open}
        onOpenChange={setRentalFormOpen}
        options={rentalForm.options}
        formKey={rentalForm.key}
      />
      <RentalDetailsDialog
        open={rentalDetails.open}
        onOpenChange={setRentalDetailsOpen}
        rentalId={rentalDetails.options}
      />
      <TransactionFormDialog
        open={txForm.open}
        onOpenChange={setTxFormOpen}
        options={txForm.options}
        formKey={txForm.key}
      />
      <ConfirmDialog open={confirmState.open} onOpenChange={setConfirmOpen} options={confirmState.options} />
    </DialogsContext.Provider>
  );
}
