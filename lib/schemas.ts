import { z } from "zod";
import {
  CAR_STATUSES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
} from "@/types";

const MAX_YEAR = new Date().getFullYear() + 1;

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, message).max(max, `${max} caractères maximum`);

const notes = z.string().trim().max(1000, "1000 caractères maximum");

const dateKey = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

// Les champs numériques utilisent `valueAsNumber` : un champ vide donne NaN → message « requis ».
const money = (requiredMessage: string) =>
  z
    .number({ error: requiredMessage })
    .positive("Le montant doit être supérieur à 0")
    .max(1_000_000, "Montant trop élevé");

export const carSchema = z.object({
  brand: requiredText("La marque est requise", 60),
  model: requiredText("Le modèle est requis", 60),
  plate: requiredText("L'immatriculation est requise", 30).transform((v) =>
    v.toUpperCase().replace(/\s+/g, " "),
  ),
  year: z
    .number({ error: "Année invalide" })
    .int("Année invalide")
    .min(1980, "Année trop ancienne")
    .max(MAX_YEAR, `L'année ne peut pas dépasser ${MAX_YEAR}`),
  color: requiredText("La couleur est requise", 40),
  dailyPrice: money("Indiquez le prix par jour"),
  mileage: z
    .number({ error: "Kilométrage invalide" })
    .int("Kilométrage invalide")
    .min(0, "Le kilométrage ne peut pas être négatif"),
  status: z.enum(CAR_STATUSES, { error: "Statut invalide" }),
  notes,
});

export const rentalSchema = z
  .object({
    carId: z.string().min(1, "Choisissez une voiture"),
    clientName: requiredText("Le nom du client est requis", 80),
    clientPhone: z
      .string()
      .trim()
      .min(8, "Numéro de téléphone trop court")
      .max(20, "Numéro de téléphone trop long")
      .regex(/^[+0-9 ().-]+$/, "Utilisez uniquement des chiffres, espaces et +"),
    startDate: dateKey("Date de début requise"),
    endDate: dateKey("Date de fin requise"),
    dailyPrice: money("Indiquez le prix par jour"),
    notes,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être identique ou postérieure à la date de début",
    path: ["endDate"],
  });

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    category: z.enum(TRANSACTION_CATEGORIES, { error: "Choisissez une catégorie" }),
    amount: money("Indiquez un montant"),
    date: dateKey("Date requise"),
    carId: z.string(),
    description: z.string().trim().max(300, "300 caractères maximum"),
  })
  .refine(
    (data) =>
      data.type === "entrée"
        ? (INCOME_CATEGORIES as readonly string[]).includes(data.category)
        : (EXPENSE_CATEGORIES as readonly string[]).includes(data.category),
    { message: "Catégorie invalide pour ce type", path: ["category"] },
  );

export type CarFormInput = z.input<typeof carSchema>;
export type CarFormOutput = z.output<typeof carSchema>;
export type RentalFormInput = z.input<typeof rentalSchema>;
export type RentalFormOutput = z.output<typeof rentalSchema>;
export type TransactionFormInput = z.input<typeof transactionSchema>;
export type TransactionFormOutput = z.output<typeof transactionSchema>;
