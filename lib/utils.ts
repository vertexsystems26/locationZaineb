import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Arrondi au millime (3 décimales) pour éviter les erreurs de flottants. */
export function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function sum(values: number[]): number {
  return round3(values.reduce((acc, v) => acc + v, 0));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}
