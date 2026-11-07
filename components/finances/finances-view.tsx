"use client";

import { useMemo, useState } from "react";
import { ChartPie, Download, Plus, Receipt, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ExpensesPieChart } from "@/components/charts/expenses-pie-chart";
import { BalanceChart } from "@/components/charts/balance-chart";
import { TransactionsTable } from "@/components/finances/transactions-table";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCars } from "@/hooks/use-cars";
import { useToday } from "@/hooks/use-rentals";
import { useTransactions } from "@/hooks/use-transactions";
import {
  balanceSeries,
  computeTotals,
  expensesByCategory,
  filterTransactions,
  fullRange,
} from "@/lib/finance";
import {
  daysBetween,
  formatDate,
  fromDateKey,
  monthRange,
  previousMonthRange,
  yearRange,
  type DateRange,
} from "@/lib/dates";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { formatDT, pluralize } from "@/lib/format";
import { carLabel } from "@/lib/rental-logic";
import { cn } from "@/lib/utils";

type Preset = "month" | "lastMonth" | "year" | "all" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "month", label: "Ce mois" },
  { value: "lastMonth", label: "Mois dernier" },
  { value: "year", label: "Cette année" },
  { value: "all", label: "Tout" },
  { value: "custom", label: "Personnalisé" },
];

export function FinancesView() {
  const { transactions, loading } = useTransactions();
  const { cars } = useCars();
  const today = useToday();
  const { openTransactionForm } = useDialogs();

  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [carId, setCarId] = useState("");

  const range = useMemo<DateRange>(() => {
    const ref = fromDateKey(today);
    switch (preset) {
      case "month":
        return monthRange(ref);
      case "lastMonth":
        return previousMonthRange(ref);
      case "year":
        return yearRange(ref);
      case "all":
        return fullRange(transactions, today);
      case "custom": {
        const all = fullRange(transactions, today);
        return { from: customFrom || all.from, to: customTo || all.to };
      }
    }
  }, [preset, today, transactions, customFrom, customTo]);

  const invalidRange = range.to < range.from;

  const filtered = useMemo(
    () => (invalidRange ? [] : filterTransactions(transactions, { range, carId: carId || undefined })),
    [transactions, range, carId, invalidRange],
  );
  const incomes = filtered.filter((t) => t.type === "entrée");
  const expenses = filtered.filter((t) => t.type === "sortie");
  const totals = computeTotals(filtered);
  const slices = useMemo(() => expensesByCategory(filtered), [filtered]);
  const balance = useMemo(() => (invalidRange ? [] : balanceSeries(filtered, range)), [filtered, range, invalidRange]);

  const periodLabel = `Du ${formatDate(range.from)} au ${formatDate(range.to)}`;
  const carFilterLabel =
    carId === "__none__"
      ? "sans voiture"
      : carId
        ? carLabel(cars.find((c) => c.id === carId) ?? { brand: "", model: "Voiture", plate: "?" })
        : "toutes les voitures";

  function exportCsv() {
    if (!filtered.length) {
      toast.info("Aucune transaction à exporter sur cette période.");
      return;
    }
    downloadCsv(`transactions_${range.from}_${range.to}.csv`, transactionsToCsv(filtered, cars));
    toast.success("Export CSV téléchargé", { description: pluralize(filtered.length, "transaction") });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Finances"
        description="Entrées, sorties et solde de votre activité."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={() => openTransactionForm({ type: "entrée" })}>
              <Plus />
              Ajouter une entrée manuelle
            </Button>
            <Button onClick={() => openTransactionForm({ type: "sortie", carId: carId && carId !== "__none__" ? carId : undefined })}>
              <Receipt />
              Ajouter une dépense
            </Button>
          </>
        }
      />

      {/* Filtres */}
      <Card className="grid gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Période</span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Période">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={preset === p.value}
                  onClick={() => setPreset(p.value)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
                    preset === p.value
                      ? "border-primary/30 bg-primary/10 font-medium text-primary"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5 lg:w-72">
            <Label htmlFor="fin-car">Voiture</Label>
            <Select id="fin-car" value={carId} onChange={(e) => setCarId(e.target.value)}>
              <option value="">Toutes les voitures</option>
              <option value="__none__">Sans voiture (frais généraux)</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {carLabel(c)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {preset === "custom" && (
          <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fin-from">Du</Label>
              <Input id="fin-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fin-to">Au</Label>
              <Input id="fin-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        <p className={cn("text-sm", invalidRange ? "font-medium text-destructive" : "text-muted-foreground")}>
          {invalidRange
            ? "La date de fin doit être postérieure à la date de début."
            : `${periodLabel} · ${carFilterLabel}`}
        </p>
      </Card>

      {/* Synthèse */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total entrées"
          value={formatDT(totals.income)}
          hint={pluralize(incomes.length, "entrée")}
          icon={TrendingUp}
          iconClassName="bg-blue-50 text-blue-700"
          loading={loading}
        />
        <StatCard
          label="Total sorties"
          value={formatDT(totals.expense)}
          hint={pluralize(expenses.length, "dépense")}
          icon={TrendingDown}
          iconClassName="bg-orange-50 text-orange-700"
          loading={loading}
        />
        <StatCard
          label="Solde"
          value={formatDT(totals.net)}
          valueClassName={totals.net < 0 ? "text-rose-700" : undefined}
          hint="Entrées − sorties"
          icon={Scale}
          iconClassName="bg-emerald-50 text-emerald-700"
          loading={loading}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dépenses par catégorie</CardTitle>
              <CardDescription>Répartition des sorties sur la période</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : slices.length ? (
              <ExpensesPieChart data={slices} />
            ) : (
              <EmptyState compact icon={ChartPie} title="Aucune dépense sur la période" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Évolution du solde</CardTitle>
              <CardDescription>
                Solde cumulé {!invalidRange && daysBetween(range.from, range.to) <= 62 ? "par jour" : "par mois"}{" "}
                depuis le début de la période
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : filtered.length ? (
              <BalanceChart data={balance} />
            ) : (
              <EmptyState compact icon={Scale} title="Aucune transaction sur la période" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableaux */}
      <Card className="overflow-hidden">
        <Tabs defaultValue="in">
          <div className="border-b px-5 pt-5 pb-4">
            <TabsList>
              <TabsTrigger value="in">
                <TrendingUp />
                Monnaies entrantes ({incomes.length})
              </TabsTrigger>
              <TabsTrigger value="out">
                <TrendingDown />
                Monnaies sortantes ({expenses.length})
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="in">
            <TransactionsTable
              transactions={incomes}
              loading={loading}
              emptyText="Aucune entrée sur cette période."
            />
          </TabsContent>
          <TabsContent value="out">
            <TransactionsTable
              transactions={expenses}
              loading={loading}
              emptyText="Aucune dépense sur cette période."
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
