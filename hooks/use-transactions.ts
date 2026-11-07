"use client";

import { useData } from "@/components/providers/data-provider";

/** Transactions (entrées et sorties) en temps réel, triées par date décroissante. */
export function useTransactions() {
  const { transactions, loading } = useData();
  return { transactions, loading: loading.transactions };
}
