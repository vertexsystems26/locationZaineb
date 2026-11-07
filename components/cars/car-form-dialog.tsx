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
import { carSchema, type CarFormInput, type CarFormOutput } from "@/lib/schemas";
import { createCar, updateCar } from "@/lib/services/cars";
import { CAR_STATUS_META } from "@/lib/constants";
import { carName } from "@/lib/rental-logic";
import { getErrorMessage } from "@/lib/utils";
import { CAR_STATUSES, type Car } from "@/types";

export function CarFormDialog({
  open,
  onOpenChange,
  car,
  formKey,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car;
  formKey: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{car ? "Modifier la voiture" : "Ajouter une voiture"}</DialogTitle>
          <DialogDescription>
            {car ? `${carName(car)} · ${car.plate}` : "Renseignez les informations du véhicule."}
          </DialogDescription>
        </DialogHeader>
        <CarForm key={formKey} car={car} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CarForm({ car, onDone }: { car?: Car; onDone: () => void }) {
  const { cars } = useCars();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CarFormInput, unknown, CarFormOutput>({
    resolver: zodResolver(carSchema),
    defaultValues: car
      ? {
          brand: car.brand,
          model: car.model,
          plate: car.plate,
          year: car.year,
          color: car.color,
          dailyPrice: car.dailyPrice,
          mileage: car.mileage,
          status: car.status,
          notes: car.notes,
        }
      : {
          brand: "",
          model: "",
          plate: "",
          year: new Date().getFullYear(),
          color: "",
          mileage: 0,
          status: "disponible",
          notes: "",
        },
  });

  const onSubmit = handleSubmit(async (values) => {
    const normalized = values.plate.replace(/\s/g, "");
    if (cars.some((c) => c.id !== car?.id && c.plate.replace(/\s/g, "").toUpperCase() === normalized)) {
      setError("plate", { message: "Une voiture avec cette immatriculation existe déjà" });
      return;
    }
    try {
      if (car) {
        await updateCar(car.id, values);
        toast.success("Voiture mise à jour");
      } else {
        await createCar(values);
        toast.success("Voiture ajoutée", { description: `${values.brand} ${values.model} · ${values.plate}` });
      }
      onDone();
    } catch (error) {
      toast.error("Enregistrement impossible", { description: getErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Marque" htmlFor="brand" error={errors.brand?.message} required>
          <Input id="brand" placeholder="Renault" autoComplete="off" aria-invalid={!!errors.brand} {...register("brand")} />
        </FormField>
        <FormField label="Modèle" htmlFor="model" error={errors.model?.message} required>
          <Input id="model" placeholder="Clio 4" autoComplete="off" aria-invalid={!!errors.model} {...register("model")} />
        </FormField>
        <FormField label="Immatriculation" htmlFor="plate" error={errors.plate?.message} required>
          <Input
            id="plate"
            placeholder="123 TUN 4567"
            autoComplete="off"
            className="uppercase"
            aria-invalid={!!errors.plate}
            {...register("plate")}
          />
        </FormField>
        <FormField label="Année" htmlFor="year" error={errors.year?.message} required>
          <Input
            id="year"
            type="number"
            inputMode="numeric"
            step={1}
            aria-invalid={!!errors.year}
            {...register("year", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Couleur" htmlFor="color" error={errors.color?.message} required>
          <Input id="color" placeholder="Blanc" aria-invalid={!!errors.color} {...register("color")} />
        </FormField>
        <FormField label="Prix par jour (DT)" htmlFor="dailyPrice" error={errors.dailyPrice?.message} required>
          <Input
            id="dailyPrice"
            type="number"
            inputMode="decimal"
            step="0.001"
            min={0}
            placeholder="90,000"
            aria-invalid={!!errors.dailyPrice}
            {...register("dailyPrice", { valueAsNumber: true })}
          />
        </FormField>
        <FormField label="Kilométrage actuel (km)" htmlFor="mileage" error={errors.mileage?.message} required>
          <Input
            id="mileage"
            type="number"
            inputMode="numeric"
            step={1}
            min={0}
            aria-invalid={!!errors.mileage}
            {...register("mileage", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          label="Statut"
          htmlFor="status"
          error={errors.status?.message}
          hint="« Loué » est mis à jour automatiquement selon les locations en cours."
        >
          <Select id="status" {...register("status")}>
            {CAR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CAR_STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Notes" htmlFor="car-notes" error={errors.notes?.message}>
        <Textarea id="car-notes" placeholder="Équipements, remarques…" rows={3} {...register("notes")} />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircle className="animate-spin" />}
          {car ? "Enregistrer" : "Ajouter la voiture"}
        </Button>
      </DialogFooter>
    </form>
  );
}
