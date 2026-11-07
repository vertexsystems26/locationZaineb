import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { DateKey } from "@/types";

export const DATE_KEY_FORMAT = "yyyy-MM-dd";

export function toDateKey(date: Date): DateKey {
  return format(date, DATE_KEY_FORMAT);
}

/** parseISO interprète `yyyy-MM-dd` en heure locale (minuit), contrairement à `new Date()`. */
export function fromDateKey(key: DateKey): Date {
  return parseISO(key);
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function addDaysToKey(key: DateKey, amount: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), amount));
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return differenceInCalendarDays(fromDateKey(to), fromDateKey(from));
}

export function monthKey(key: DateKey): string {
  return key.slice(0, 7);
}

// ---------- Périodes ----------
export interface DateRange {
  from: DateKey;
  to: DateKey;
}

export function monthRange(reference: Date): DateRange {
  return { from: toDateKey(startOfMonth(reference)), to: toDateKey(endOfMonth(reference)) };
}

export function previousMonthRange(reference: Date): DateRange {
  return monthRange(subMonths(reference, 1));
}

export function yearRange(reference: Date): DateRange {
  return { from: toDateKey(startOfYear(reference)), to: toDateKey(endOfYear(reference)) };
}

export function isInRange(key: DateKey, range: Partial<DateRange>): boolean {
  if (range.from && key < range.from) return false;
  if (range.to && key > range.to) return false;
  return true;
}

// ---------- Affichage (locale fr) ----------
export function formatDate(key: DateKey | null | undefined, pattern = "d MMM yyyy"): string {
  if (!key || !isDateKey(key)) return "—";
  return format(fromDateKey(key), pattern, { locale: fr });
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return format(date, "d MMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatPeriod(start: DateKey, end: DateKey): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDate(start, sameYear ? "d MMM" : "d MMM yyyy")} → ${formatDate(end)}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** « aujourd'hui », « demain », « dans 3 jours », « il y a 2 jours ». */
export function relativeDay(key: DateKey, today: DateKey): string {
  const diff = daysBetween(today, key);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "demain";
  if (diff === -1) return "hier";
  return diff > 0 ? `dans ${diff} jours` : `il y a ${-diff} jours`;
}
