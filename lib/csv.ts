import type { Car, Transaction } from "@/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { carLabel } from "@/lib/rental-logic";

/** Échappe une cellule CSV (séparateur `;` pour Excel en français). */
function cell(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function transactionsToCsv(transactions: Transaction[], cars: Car[]): string {
  const carsById = new Map(cars.map((c) => [c.id, c]));
  const header = ["Date", "Type", "Catégorie", "Voiture", "Description", "Montant (DT)", "ID location"];
  const rows = transactions.map((t) => {
    const car = t.carId ? carsById.get(t.carId) : undefined;
    const signed = t.type === "sortie" ? -t.amount : t.amount;
    return [
      t.date,
      t.type === "entrée" ? "Entrée" : "Sortie",
      CATEGORY_LABELS[t.category],
      car ? carLabel(car) : t.carId ? "Voiture supprimée" : "",
      t.description,
      signed.toFixed(3).replace(".", ","),
      t.rentalId ?? "",
    ];
  });
  return [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const blob = new Blob(["﻿", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
