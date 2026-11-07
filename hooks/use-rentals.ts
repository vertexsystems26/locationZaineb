"use client";

import { useData } from "@/components/providers/data-provider";

/** Locations en temps réel, statut recalculé selon la date du jour (triées par début décroissant). */
export function useRentals() {
  const { rentals, loading, today } = useData();
  return { rentals, loading: loading.rentals, today };
}

/** Date du jour au format `yyyy-MM-dd`, mise à jour automatiquement. */
export function useToday() {
  return useData().today;
}
