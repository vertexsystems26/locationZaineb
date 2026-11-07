import { eachDayOfInterval, eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateKey, ExpenseCategory, Transaction, TransactionType } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";
import { CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS } from "@/lib/constants";
import { daysBetween, fromDateKey, isInRange, monthKey, toDateKey, type DateRange } from "@/lib/dates";
import { round3, sum } from "@/lib/utils";

export function totalOf(transactions: Transaction[], type: TransactionType): number {
  return sum(transactions.filter((t) => t.type === type).map((t) => t.amount));
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export function computeTotals(transactions: Transaction[]): Totals {
  const income = totalOf(transactions, "entrée");
  const expense = totalOf(transactions, "sortie");
  return { income, expense, net: round3(income - expense) };
}

export function filterTransactions(
  transactions: Transaction[],
  filters: { range?: Partial<DateRange>; carId?: string },
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.range && !isInRange(t.date, filters.range)) return false;
    if (filters.carId === "__none__") return !t.carId;
    if (filters.carId && t.carId !== filters.carId) return false;
    return true;
  });
}

export interface MonthPoint {
  key: string;
  label: string;
  fullLabel: string;
  income: number;
  expense: number;
  net: number;
}

/** Entrées / sorties par mois sur les `months` derniers mois (mois courant inclus). */
export function monthlySeries(transactions: Transaction[], months: number, today: DateKey): MonthPoint[] {
  const end = startOfMonth(fromDateKey(today));
  const start = subMonths(end, months - 1);
  const buckets = new Map<string, MonthPoint>();

  for (const month of eachMonthOfInterval({ start, end })) {
    const key = format(month, "yyyy-MM");
    buckets.set(key, {
      key,
      label: format(month, "MMM yy", { locale: fr }),
      fullLabel: format(month, "MMMM yyyy", { locale: fr }),
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  for (const t of transactions) {
    const bucket = buckets.get(monthKey(t.date));
    if (!bucket) continue;
    if (t.type === "entrée") bucket.income = round3(bucket.income + t.amount);
    else bucket.expense = round3(bucket.expense + t.amount);
  }

  return [...buckets.values()].map((b) => ({ ...b, net: round3(b.income - b.expense) }));
}

export interface CategorySlice {
  category: ExpenseCategory;
  label: string;
  value: number;
  share: number;
  color: string;
}

/** Dépenses regroupées par catégorie, dans l'ordre fixe des catégories (couleurs stables). */
export function expensesByCategory(transactions: Transaction[]): CategorySlice[] {
  const expenses = transactions.filter((t) => t.type === "sortie");
  const total = totalOf(expenses, "sortie");
  return EXPENSE_CATEGORIES.map((category) => {
    const value = sum(expenses.filter((t) => t.category === category).map((t) => t.amount));
    return {
      category,
      label: CATEGORY_LABELS[category],
      value,
      share: total > 0 ? value / total : 0,
      color: EXPENSE_CATEGORY_COLORS[category],
    };
  }).filter((slice) => slice.value > 0);
}

export interface BalancePoint {
  key: string;
  label: string;
  fullLabel: string;
  balance: number;
  net: number;
}

/**
 * Solde cumulé sur la période : point par jour si la période fait ≤ 62 jours, sinon par mois.
 * Le solde part de 0 au début de la période.
 */
export function balanceSeries(transactions: Transaction[], range: DateRange): BalancePoint[] {
  if (!range.from || !range.to || range.to < range.from) return [];
  const daily = daysBetween(range.from, range.to) <= 62;
  const start = fromDateKey(range.from);
  const end = fromDateKey(range.to);

  const steps = daily
    ? eachDayOfInterval({ start, end }).map((d) => ({
        key: toDateKey(d),
        label: format(d, "d MMM", { locale: fr }),
        fullLabel: format(d, "EEEE d MMMM yyyy", { locale: fr }),
      }))
    : eachMonthOfInterval({ start, end }).map((d) => ({
        key: format(d, "yyyy-MM"),
        label: format(d, "MMM yy", { locale: fr }),
        fullLabel: format(d, "MMMM yyyy", { locale: fr }),
      }));

  const netByStep = new Map<string, number>();
  for (const t of transactions) {
    if (!isInRange(t.date, range)) continue;
    const key = daily ? t.date : monthKey(t.date);
    const signed = t.type === "entrée" ? t.amount : -t.amount;
    netByStep.set(key, round3((netByStep.get(key) ?? 0) + signed));
  }

  let balance = 0;
  return steps.map((step) => {
    const net = netByStep.get(step.key) ?? 0;
    balance = round3(balance + net);
    return { ...step, net, balance };
  });
}

/** Plage couvrant toutes les transactions (pour le filtre « Tout »). */
export function fullRange(transactions: Transaction[], today: DateKey): DateRange {
  if (!transactions.length) return { from: toDateKey(startOfMonth(fromDateKey(today))), to: today };
  let from = transactions[0].date;
  let to = today;
  for (const t of transactions) {
    if (t.date < from) from = t.date;
    if (t.date > to) to = t.date;
  }
  // Commence au 1er du mois pour un graphique lisible.
  return { from: toDateKey(startOfMonth(fromDateKey(from))), to };
}
