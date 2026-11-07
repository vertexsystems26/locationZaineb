"use client";

import { useMemo, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, LoaderCircle } from "lucide-react";
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
import { useRentals } from "@/hooks/use-rentals";
import { rentalSchema, type RentalFormInput, type RentalFormOutput } from "@/lib/schemas";
import { createRental, updateRental } from "@/lib/services/rentals";
import {
  RentalOverlapError,
  carLabel,
  computeDays,
  computeTotal,
  findConflicts,
} from "@/lib/rental-logic";
import { addDaysToKey, formatDate } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import type { RentalFormOptions } from "@/components/providers/dialogs-context";
import type { Rental } from "@/types";

export function RentalFormDialog({
  open,
  onOpenChange,
  options,
  formKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: RentalFormOptions;
  formKey: number;
}) {
  const rental = options.rental;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rental ? "Modifier la location" : "Nouvelle location"}</DialogTitle>
          <DialogDescription>
            {rental
              ? `${rental.clientName} · ${rental.carLabel}`
              : "Le montant est ajouté automatiquement aux entrées d'argent."}
          </DialogDescription>
        </DialogHeader>
        <RentalForm key={formKey} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function RentalForm({ options, onDone }: { options: RentalFormOptions; onDone: () => void }) {
  const { cars } = useCars();
  const { rentals, today } = useRentals();
  const rental: Rental | undefined = options.rental;

  const initialCar = cars.find((c) => c.id === (rental?.carId ?? options.carId));
  const initialStart = rental?.startDate ?? options.startDate ?? today;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RentalFormInput, unknown, RentalFormOutput>({
    resolver: zodResolver(rentalSchema),
    defaultValues: rental
      ? {
          carId: rental.carId,
          clientName: rental.clientName,
          clientPhone: rental.clientPhone,
          startDate: rental.startDate,
          endDate: rental.endDate,
          dailyPrice: rental.dailyPrice,
          notes: rental.notes,
        }
      : {
          carId: initialCar?.id ?? "",
          clientName: "",
          clientPhone: "",
          startDate: initialStart,
          endDate: addDaysToKey(initialStart, 1),
          dailyPrice: initialCar?.dailyPrice,
          notes: "",
        },
  });

  const [carId, startDate, endDate, dailyPrice] = useWatch({
    control,
    name: ["carId", "startDate", "endDate", "dailyPrice"],
  });

  const validPeriod = Boolean(startDate && endDate && endDate >= startDate);
  const days = validPeriod ? computeDays(startDate, endDate) : 0;
  const price = Number.isFinite(dailyPrice) ? Number(dailyPrice) : 0;
  const total = computeTotal(days, price);

  // Disponibilité de chaque voiture sur la période choisie (mise à jour en direct).
  const carOptions = useMemo(
    () =>
      cars.map((car) => {
        const busy =
          validPeriod &&
          findConflicts(rentals, { carId: car.id, startDate, endDate, excludeId: rental?.id }).length > 0;
        const blockedByMaintenance =
          car.status === "maintenance" && car.id !== rental?.carId && validPeriod && startDate <= today;
        const reason = busy ? "déjà louée sur la période" : blockedByMaintenance ? "en maintenance" : null;
        return { car, disabled: Boolean(reason), reason };
      }),
    [cars, rentals, startDate, endDate, validPeriod, rental?.id, rental?.carId, today],
  );

  const conflicts = useMemo(
    () => (validPeriod ? findConflicts(rentals, { carId, startDate, endDate, excludeId: rental?.id }) : []),
    [rentals, carId, startDate, endDate, validPeriod, rental?.id],
  );
  const conflictMessage = conflicts.length ? new RentalOverlapError(conflicts[0]).message : null;
  const selectedCar = cars.find((c) => c.id === carId);
  const maintenanceWarning =
    selectedCar?.status === "maintenance" && validPeriod && startDate > today
      ? "Cette voiture est actuellement en maintenance : vérifiez qu'elle sera prête au départ."
      : null;
  const availableCount = carOptions.filter((o) => !o.disabled).length;

  const onSubmit = handleSubmit(async (values) => {
    if (conflictMessage) {
      setError("root", { message: conflictMessage });
      return;
    }
    const car = cars.find((c) => c.id === values.carId);
    const label = car ? carLabel(car) : (rental?.carLabel ?? "");
    try {
      if (rental) {
        await updateRental(rental.id, values, label);
        toast.success("Location mise à jour", { description: "L'entrée financière liée a été ajustée." });
      } else {
        await createRental(values, label);
        toast.success("Location créée", {
          description: `${formatDT(computeTotal(computeDays(values.startDate, values.endDate), values.dailyPrice))} ajouté aux entrées.`,
        });
      }
      onDone();
    } catch (error) {
      if (error instanceof RentalOverlapError) setError("root", { message: error.message });
      toast.error("Enregistrement impossible", { description: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Date de début" htmlFor="startDate" error={errors.startDate?.message} required>
          <Input
            id="startDate"
            type="date"
            aria-invalid={!!errors.startDate}
            {...register("startDate", {
              onChange: (e: ChangeEvent<HTMLInputElement>) => {
                // Garde une fin cohérente si l'utilisateur avance la date de début.
                const next = e.target.value;
                if (next && endDate && endDate < next) setValue("endDate", addDaysToKey(next, 1));
              },
            })}
          />
        </FormField>
        <FormField label="Date de fin (retour)" htmlFor="endDate" error={errors.endDate?.message} required>
          <Input
            id="endDate"
            type="date"
            min={startDate || undefined}
            aria-invalid={!!errors.endDate}
            {...register("endDate")}
          />
        </FormField>

        <FormField
          label="Voiture"
          htmlFor="carId"
          error={errors.carId?.message}
          required
          className="sm:col-span-2"
          hint={
            validPeriod
              ? `${pluralize(availableCount, "voiture disponible", "voitures disponibles")} sur cette période.`
              : undefined
          }
        >
          <Select
            id="carId"
            aria-invalid={!!errors.carId || !!conflictMessage}
            {...register("carId", {
              onChange: (e: ChangeEvent<HTMLSelectElement>) => {
                const car = cars.find((c) => c.id === e.target.value);
                if (car) setValue("dailyPrice", car.dailyPrice, { shouldValidate: true });
              },
            })}
          >
            <option value="">Choisir une voiture…</option>
            {rental && !cars.some((c) => c.id === rental.carId) && (
              <option value={rental.carId}>{rental.carLabel} (supprimée)</option>
            )}
            {carOptions.map(({ car, disabled, reason }) => (
              <option key={car.id} value={car.id} disabled={disabled && car.id !== carId}>
                {carLabel(car)} — {formatDT(car.dailyPrice)}/j{reason ? ` (${reason})` : ""}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Nom du client" htmlFor="clientName" error={errors.clientName?.message} required>
          <Input
            id="clientName"
            placeholder="Mohamed Ben Ali"
            autoComplete="off"
            aria-invalid={!!errors.clientName}
            {...register("clientName")}
          />
        </FormField>
        <FormField label="Téléphone" htmlFor="clientPhone" error={errors.clientPhone?.message} required>
          <Input
            id="clientPhone"
            type="tel"
            inputMode="tel"
            placeholder="+216 20 123 456"
            autoComplete="off"
            aria-invalid={!!errors.clientPhone}
            {...register("clientPhone")}
          />
        </FormField>
        <FormField
          label="Prix par jour (DT)"
          htmlFor="dailyPrice"
          error={errors.dailyPrice?.message}
          hint="Pré-rempli depuis la voiture, modifiable."
          required
        >
          <Input
            id="dailyPrice"
            type="number"
            inputMode="decimal"
            step="0.001"
            min={0}
            aria-invalid={!!errors.dailyPrice}
            {...register("dailyPrice", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Notes" htmlFor="rental-notes" error={errors.notes?.message}>
          <Textarea
            id="rental-notes"
            rows={1}
            className="min-h-9"
            placeholder="Caution, permis, remarques…"
            {...register("notes")}
          />
        </FormField>
      </div>

      {(conflictMessage || errors.root?.message) && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{conflictMessage ?? errors.root?.message}</p>
        </div>
      )}
      {maintenanceWarning && !conflictMessage && (
        <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <p>{maintenanceWarning}</p>
        </div>
      )}

      {/* Récapitulatif calculé en direct */}
      <div className="grid gap-3 rounded-lg bg-secondary/70 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Durée</p>
          <p className="mt-0.5 font-semibold">{validPeriod ? pluralize(days, "jour") : "—"}</p>
          {validPeriod && (
            <p className="text-xs text-muted-foreground">
              {formatDate(startDate, "d MMM")} → {formatDate(endDate, "d MMM")}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prix par jour</p>
          <p className="mt-0.5 font-semibold">{formatDT(price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-0.5 text-lg font-semibold text-primary">{formatDT(total)}</p>
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-3">
          Facturation par 24 h : du 3 au 5 = 2 jours (minimum 1 jour). La voiture peut être relouée dès son jour de
          retour.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || Boolean(conflictMessage)}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {rental ? "Enregistrer" : "Créer la location"}
        </Button>
      </DialogFooter>
    </form>
  );
}
