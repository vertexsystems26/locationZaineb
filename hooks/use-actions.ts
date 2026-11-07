"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useRentals } from "@/hooks/use-rentals";
import { deleteCar } from "@/lib/services/cars";
import { cancelRental, deleteRental } from "@/lib/services/rentals";
import { deleteTransaction } from "@/lib/services/transactions";
import { carName } from "@/lib/rental-logic";
import { formatDT, pluralize } from "@/lib/format";
import { formatPeriod } from "@/lib/dates";
import type { Car, Rental, Transaction } from "@/types";

export function useCarActions() {
  const { confirm } = useDialogs();
  const { rentals } = useRentals();
  const router = useRouter();

  function requestDelete(car: Car, options?: { redirect?: boolean }) {
    const active = rentals.filter(
      (r) => r.carId === car.id && (r.status === "à venir" || r.status === "en cours"),
    );
    if (active.length) {
      toast.error("Suppression impossible", {
        description: `Cette voiture a ${pluralize(active.length, "location")} en cours ou à venir. Annulez-les d'abord.`,
      });
      return;
    }
    confirm({
      title: `Supprimer ${carName(car)} (${car.plate}) ?`,
      description:
        "La voiture sera retirée de la flotte. L'historique des locations et des transactions est conservé pour vos finances.",
      confirmLabel: "Supprimer la voiture",
      destructive: true,
      onConfirm: async () => {
        await deleteCar(car.id);
        toast.success("Voiture supprimée");
        if (options?.redirect) router.push("/voitures");
      },
    });
  }

  return { requestDelete };
}

export function useRentalActions() {
  const { confirm } = useDialogs();

  function requestCancel(rental: Rental, onDone?: () => void) {
    confirm({
      title: "Annuler cette location ?",
      description: `${rental.clientName} · ${rental.carLabel} · ${formatPeriod(rental.startDate, rental.endDate)}. L'entrée de ${formatDT(
        rental.totalPrice,
      )} liée à cette location sera supprimée des finances.`,
      confirmLabel: "Annuler la location",
      destructive: true,
      onConfirm: async () => {
        await cancelRental(rental.id);
        toast.success("Location annulée", { description: "L'entrée liée a été retirée des finances." });
        onDone?.();
      },
    });
  }

  function requestDelete(rental: Rental, onDone?: () => void) {
    confirm({
      title: "Supprimer définitivement cette location ?",
      description: `${rental.clientName} · ${formatPeriod(rental.startDate, rental.endDate)}. La location et son entrée financière seront supprimées. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        await deleteRental(rental.id);
        toast.success("Location supprimée");
        onDone?.();
      },
    });
  }

  return { requestCancel, requestDelete };
}

export function useTransactionActions() {
  const { confirm } = useDialogs();

  function requestDelete(transaction: Transaction) {
    if (transaction.rentalId) {
      toast.info("Entrée liée à une location", {
        description: "Modifiez ou annulez la location correspondante pour mettre à jour ce montant.",
      });
      return;
    }
    confirm({
      title: transaction.type === "sortie" ? "Supprimer cette dépense ?" : "Supprimer cette entrée ?",
      description: `${formatDT(transaction.amount)}${transaction.description ? ` · ${transaction.description}` : ""}. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      destructive: true,
      onConfirm: async () => {
        await deleteTransaction(transaction);
        toast.success(transaction.type === "sortie" ? "Dépense supprimée" : "Entrée supprimée");
      },
    });
  }

  return { requestDelete };
}
