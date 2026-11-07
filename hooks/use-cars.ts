"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import type { Car } from "@/types";

/** Liste des voitures en temps réel (triées par marque/modèle). */
export function useCars() {
  const { cars, loading } = useData();
  return { cars, loading: loading.cars };
}

export function useCar(id: string | null | undefined): { car: Car | null; loading: boolean } {
  const { cars, loading } = useCars();
  const car = useMemo(() => (id ? (cars.find((c) => c.id === id) ?? null) : null), [cars, id]);
  return { car, loading };
}

/** Accès rapide id → voiture. */
export function useCarsById(): Map<string, Car> {
  const { cars } = useCars();
  return useMemo(() => new Map(cars.map((c) => [c.id, c])), [cars]);
}
