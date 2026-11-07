"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarCheck,
  CarFront,
  PiggyBank,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LegendItem } from "@/components/charts/chart-tooltip";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCars } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { useTransactions } from "@/hooks/use-transactions";
import { computeTotals, filterTransactions, monthlySeries } from "@/lib/finance";
import { capitalize, formatDate, fromDateKey, monthRange, relativeDay } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";
import { CHART } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DateKey, Rental } from "@/types";

export function DashboardView() {
  const { cars, loading: carsLoading } = useCars();
  const { rentals, loading: rentalsLoading, today } = useRentals();
  const { transactions, loading: txLoading } = useTransactions();
  const { openRentalForm, openTransactionForm, openCarForm } = useDialogs();
  const [months, setMonths] = useState<6 | 12>(12);
  const [view, setView] = useState<"chart" | "table">("chart");

  const monthLabel = capitalize(formatDate(today, "MMMM yyyy"));
  const totals = useMemo(
    () => computeTotals(filterTransactions(transactions, { range: monthRange(fromDateKey(today)) })),
    [transactions, today],
  );
  const series = useMemo(() => monthlySeries(transactions, months, today), [transactions, months, today]);

  const fleet = {
    rented: cars.filter((c) => c.status === "loué").length,
    available: cars.filter((c) => c.status === "disponible").length,
    maintenance: cars.filter((c) => c.status === "maintenance").length,
  };

  const upcoming = rentals
    .filter((r) => r.status === "à venir")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 6);
  const endingSoon = rentals
    .filter((r) => r.status === "en cours")
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 6);

  const seriesHasData = series.some((p) => p.income > 0 || p.expense > 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Tableau de bord"
        description={`Vue d'ensemble de votre activité · ${monthLabel}`}
        actions={
          <>
            <Button variant="outline" onClick={() => openTransactionForm({ type: "sortie" })}>
              <Receipt />
              Ajouter une dépense
            </Button>
            <Button onClick={() => openRentalForm()}>
              <Plus />
              Nouvelle location
            </Button>
          </>
        }
      />

      {!carsLoading && cars.length === 0 && (
        <EmptyState
          icon={CarFront}
          title="Bienvenue ! Commencez par ajouter votre première voiture"
          description="Vous pourrez ensuite créer des locations, suivre le calendrier et vos finances."
          action={
            <Button onClick={() => openCarForm()}>
              <Plus />
              Ajouter une voiture
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entrées du mois"
          value={formatDT(totals.income)}
          hint={monthLabel}
          icon={TrendingUp}
          iconClassName="bg-blue-50 text-blue-700"
          loading={txLoading}
        />
        <StatCard
          label="Sorties du mois"
          value={formatDT(totals.expense)}
          hint={monthLabel}
          icon={TrendingDown}
          iconClassName="bg-orange-50 text-orange-700"
          loading={txLoading}
        />
        <StatCard
          label="Bénéfice net du mois"
          value={formatDT(totals.net)}
          valueClassName={totals.net < 0 ? "text-rose-700" : undefined}
          hint="Entrées − sorties"
          icon={PiggyBank}
          iconClassName="bg-emerald-50 text-emerald-700"
          loading={txLoading}
        />
        <StatCard
          label="Louées / disponibles"
          value={
            <>
              {fleet.rented} <span className="text-muted-foreground">/</span> {fleet.available}
            </>
          }
          hint={`Sur ${pluralize(cars.length, "voiture")}${fleet.maintenance ? ` · ${fleet.maintenance} en maintenance` : ""}`}
          icon={CarFront}
          loading={carsLoading || rentalsLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Entrées vs sorties</CardTitle>
            <CardDescription>Par mois, sur les {months} derniers mois</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              value={String(months)}
              onChange={(v) => setMonths(Number(v) as 6 | 12)}
              options={[
                { value: "6", label: "6 mois" },
                { value: "12", label: "12 mois" },
              ]}
            />
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as "chart" | "table")}
              options={[
                { value: "chart", label: "Graphique" },
                { value: "table", label: "Tableau" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {txLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : view === "chart" ? (
            <>
              <div className="flex gap-4">
                <LegendItem color={CHART.income} label="Entrées" />
                <LegendItem color={CHART.expense} label="Sorties" />
              </div>
              {seriesHasData ? (
                <IncomeExpenseChart data={series} />
              ) : (
                <EmptyState
                  compact
                  icon={TrendingUp}
                  title="Pas encore de transactions"
                  description="Les entrées des locations et vos dépenses apparaîtront ici."
                />
              )}
            </>
          ) : (
            <div className="-mx-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-right">Entrées</TableHead>
                    <TableHead className="text-right">Sorties</TableHead>
                    <TableHead className="text-right">Bénéfice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...series].reverse().map((p) => (
                    <TableRow key={p.key}>
                      <TableCell className="capitalize">{p.fullLabel}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatDT(p.income)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatDT(p.expense)}</TableCell>
                      <TableCell className={cn("text-right font-medium tabular-nums", p.net < 0 && "text-rose-700")}>
                        {formatDT(p.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RentalListCard
          title="Prochaines locations"
          description="Départs à venir"
          icon={CalendarClock}
          rentals={upcoming}
          loading={rentalsLoading}
          today={today}
          dateOf={(r) => r.startDate}
          prefix="Départ"
          emptyText="Aucune location à venir."
        />
        <RentalListCard
          title="Se terminent bientôt"
          description="Locations en cours, par date de retour"
          icon={CalendarCheck}
          rentals={endingSoon}
          loading={rentalsLoading}
          today={today}
          dateOf={(r) => r.endDate}
          prefix="Retour"
          emptyText="Aucune location en cours."
        />
      </div>
    </div>
  );
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-secondary p-0.5" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RentalListCard({
  title,
  description,
  icon: Icon,
  rentals,
  loading,
  today,
  dateOf,
  prefix,
  emptyText,
}: {
  title: string;
  description: string;
  icon: typeof CalendarClock;
  rentals: Rental[];
  loading: boolean;
  today: DateKey;
  dateOf: (r: Rental) => DateKey;
  prefix: string;
  emptyText: string;
}) {
  const { openRentalDetails } = useDialogs();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/locations">Tout voir</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-3">
        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </p>
        ) : (
          <ul className="-mx-2 grid gap-1">
            {rentals.map((r) => {
              const date = dateOf(r);
              const soon = date <= today;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openRentalDetails(r)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.clientName}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.carLabel}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          soon ? "text-amber-700" : "text-foreground",
                        )}
                      >
                        {prefix} {relativeDay(date, today)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(date, "EEE d MMM")}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
