"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { useCars } from "@/hooks/use-cars";
import { useToday } from "@/hooks/use-rentals";
import { transactionSchema, type TransactionFormInput, type TransactionFormOutput } from "@/lib/schemas";
import { createTransaction, updateTransaction } from "@/lib/services/transactions";
import { CATEGORY_LABELS, INCOME_CATEGORY_LABELS } from "@/lib/constants";
import { carLabel } from "@/lib/rental-logic";
import { formatDT } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import type { TransactionFormOptions } from "@/components/providers/dialogs-context";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/types";

export function TransactionFormDialog({
  open,
  onOpenChange,
  options,
  formKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: TransactionFormOptions;
  formKey: number;
}) {
  const isExpense = options.type === "sortie";
  const editing = Boolean(options.transaction);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isExpense
              ? editing
                ? "Modifier la dépense"
                : "Ajouter une dépense"
              : editing
                ? "Modifier l'entrée"
                : "Ajouter une entrée manuelle"}
          </DialogTitle>
          <DialogDescription>
            {isExpense
              ? "Vidange, assurance, réparation… enregistrée comme sortie d'argent."
              : "Pour un encaissement hors location saisie (les locations créent leur entrée automatiquement)."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm key={formKey} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({ options, onDone }: { options: TransactionFormOptions; onDone: () => void }) {
  const { cars } = useCars();
  const today = useToday();
  const { transaction, type } = options;
  const isExpense = type === "sortie";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormInput, unknown, TransactionFormOutput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          date: transaction.date,
          carId: transaction.carId ?? "",
          description: transaction.description,
        }
      : {
          type,
          category: isExpense ? "vidange" : "location",
          date: today,
          carId: options.carId ?? "",
          description: "",
        },
  });

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      type: values.type,
      category: values.category,
      amount: values.amount,
      date: values.date,
      carId: values.carId || null,
      rentalId: null,
      description: values.description,
    };
    try {
      if (transaction) {
        await updateTransaction(transaction, input);
        toast.success("Transaction mise à jour");
      } else {
        await createTransaction(input);
        toast.success(isExpense ? "Dépense ajoutée" : "Entrée ajoutée", {
          description: `${formatDT(values.amount)} · ${CATEGORY_LABELS[values.category]}`,
        });
      }
      onDone();
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <input type="hidden" {...register("type")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Catégorie" htmlFor="category" error={errors.category?.message} required>
          <Select id="category" aria-invalid={!!errors.category} {...register("category")}>
            {isExpense
              ? EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))
              : INCOME_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {INCOME_CATEGORY_LABELS[c]}
                  </option>
                ))}
          </Select>
        </FormField>
        <FormField label="Montant (DT)" htmlFor="amount" error={errors.amount?.message} required>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.001"
            min={0}
            placeholder="0,000"
            aria-invalid={!!errors.amount}
            {...register("amount", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Date" htmlFor="date" error={errors.date?.message} required>
          <Input id="date" type="date" aria-invalid={!!errors.date} {...register("date")} />
        </FormField>
        <FormField label="Voiture" htmlFor="tx-car" hint={isExpense ? "Optionnel (ex. assurance globale)" : "Optionnel"}>
          <Select id="tx-car" {...register("carId")}>
            <option value="">Aucune voiture</option>
            {transaction?.carId && !cars.some((c) => c.id === transaction.carId) && (
              <option value={transaction.carId}>Voiture supprimée</option>
            )}
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {carLabel(car)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          rows={2}
          placeholder={isExpense ? "Vidange 10 000 km, garage Ben Salah…" : "Détail de l'encaissement"}
          {...register("description")}
        />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {transaction ? "Enregistrer" : isExpense ? "Ajouter la dépense" : "Ajouter l'entrée"}
        </Button>
      </DialogFooter>
    </form>
  );
}
