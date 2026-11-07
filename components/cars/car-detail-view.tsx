"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  KeyRound,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { CarStatusBadge } from "@/components/shared/status-badge";
import { RentalsTable } from "@/components/rentals/rentals-table";
import { TransactionsTable } from "@/components/finances/transactions-table";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCarActions } from "@/hooks/use-actions";
import { useCar } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { useTransactions } from "@/hooks/use-transactions";
import { computeTotals } from "@/lib/finance";
import { formatDateTime } from "@/lib/dates";
import { formatDT, formatKm, pluralize } from "@/lib/format";
import { carName } from "@/lib/rental-logic";

export function CarDetailView({ id }: { id: string }) {
  const { car, loading } = useCar(id);
  const { rentals, loading: rentalsLoading } = useRentals();
  const { transactions, loading: txLoading } = useTransactions();
  const { openCarForm, openRentalForm, openTransactionForm } = useDialogs();
  const { requestDelete } = useCarActions();

  const carRentals = useMemo(() => rentals.filter((r) => r.carId === id), [rentals, id]);
  const carTransactions = useMemo(() => transactions.filter((t) => t.carId === id), [transactions, id]);
  const expenses = carTransactions.filter((t) => t.type === "sortie");
  const incomes = carTransactions.filter((t) => t.type === "entrée");
  const totals = computeTotals(carTransactions);
  const activeRentals = carRentals.filter((r) => r.status !== "annulée");
  const rentedDays = activeRentals.reduce((acc, r) => acc + r.days, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!car) {
    return (
      <EmptyState
        icon={CarFront}
        title="Voiture introuvable"
        description="Cette voiture a peut-être été supprimée."
        action={
          <Button asChild variant="outline">
            <Link href="/voitures">
              <ArrowLeft />
              Retour aux voitures
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid gap-4">
        <Link
          href="/voitures"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voitures
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{carName(car)}</h1>
              <CarStatusBadge status={car.status} />
            </div>
            <p className="mt-2 inline-block rounded border bg-card px-2 py-0.5 font-mono text-sm tracking-wide">
              {car.plate}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openTransactionForm({ type: "sortie", carId: car.id })}>
              <Receipt />
              Ajouter une dépense
            </Button>
            <Button variant="outline" onClick={() => openCarForm(car)}>
              <Pencil />
              Modifier
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:bg-rose-50 hover:text-destructive"
              onClick={() => requestDelete(car, { redirect: true })}
            >
              <Trash2 />
              Supprimer
            </Button>
            <Button onClick={() => openRentalForm({ carId: car.id })}>
              <Plus />
              Nouvelle location
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenus générés"
          value={formatDT(totals.income)}
          hint={pluralize(incomes.length, "entrée")}
          icon={TrendingUp}
          iconClassName="bg-blue-50 text-blue-700"
          loading={txLoading}
        />
        <StatCard
          label="Dépenses"
          value={formatDT(totals.expense)}
          hint={pluralize(expenses.length, "dépense")}
          icon={TrendingDown}
          iconClassName="bg-orange-50 text-orange-700"
          loading={txLoading}
        />
        <StatCard
          label="Bénéfice net"
          value={formatDT(totals.net)}
          valueClassName={totals.net < 0 ? "text-rose-700" : undefined}
          hint="Revenus − dépenses"
          icon={PiggyBank}
          iconClassName="bg-emerald-50 text-emerald-700"
          loading={txLoading}
        />
        <StatCard
          label="Locations"
          value={activeRentals.length}
          hint={`${pluralize(rentedDays, "jour loué", "jours loués")}`}
          icon={KeyRound}
          loading={rentalsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <InfoRow label="Marque" value={car.brand} />
              <InfoRow label="Modèle" value={car.model} />
              <InfoRow label="Immatriculation" value={car.plate} />
              <InfoRow label="Année" value={String(car.year)} />
              <InfoRow label="Couleur" value={car.color} />
              <InfoRow label="Prix par jour" value={formatDT(car.dailyPrice)} />
              <InfoRow label="Kilométrage" value={formatKm(car.mileage)} />
              <InfoRow label="Ajoutée le" value={formatDateTime(car.createdAt)} />
            </dl>
            {car.notes && (
              <div className="mt-4 rounded-lg bg-secondary/70 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                <p className="whitespace-pre-line">{car.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <Tabs defaultValue="rentals">
            <div className="border-b px-5 pt-5 pb-4">
              <TabsList>
                <TabsTrigger value="rentals">
                  <CalendarDays />
                  Locations ({carRentals.length})
                </TabsTrigger>
                <TabsTrigger value="expenses">
                  <TrendingDown />
                  Dépenses ({expenses.length})
                </TabsTrigger>
                <TabsTrigger value="incomes">
                  <TrendingUp />
                  Entrées ({incomes.length})
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="rentals">
              <RentalsTable
                rentals={carRentals}
                loading={rentalsLoading}
                showCar={false}
                emptyText="Aucune location pour cette voiture."
              />
            </TabsContent>
            <TabsContent value="expenses">
              <TransactionsTable
                transactions={expenses}
                loading={txLoading}
                showCar={false}
                emptyText="Aucune dépense enregistrée pour cette voiture."
              />
            </TabsContent>
            <TabsContent value="incomes">
              <TransactionsTable
                transactions={incomes}
                loading={txLoading}
                showCar={false}
                emptyText="Aucune entrée pour cette voiture."
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
