"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CarFront, Eye, Gauge, KeyRound, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CarStatusBadge } from "@/components/shared/status-badge";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCarActions } from "@/hooks/use-actions";
import { useCars } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { CAR_STATUS_META } from "@/lib/constants";
import { formatDate, relativeDay } from "@/lib/dates";
import { formatDT, formatKm } from "@/lib/format";
import { carName } from "@/lib/rental-logic";
import { cn } from "@/lib/utils";
import { CAR_STATUSES, type Car, type CarStatus, type DateKey, type Rental } from "@/types";

export function CarsView() {
  const { cars, loading } = useCars();
  const { rentals, today } = useRentals();
  const { openCarForm } = useDialogs();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CarStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cars.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return `${c.brand} ${c.model} ${c.plate} ${c.color}`.toLowerCase().includes(q);
    });
  }, [cars, search, status]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: cars.length };
    for (const s of CAR_STATUSES) map[s] = cars.filter((c) => c.status === s).length;
    return map;
  }, [cars]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Voitures"
        description="Gérez votre flotte, ses tarifs et son état."
        actions={
          <Button onClick={() => openCarForm()}>
            <Plus />
            Ajouter une voiture
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...CAR_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                status === s
                  ? "border-primary/30 bg-primary/10 font-medium text-primary"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? "Toutes" : CAR_STATUS_META[s].label}
              <span className="text-xs tabular-nums opacity-70">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Marque, modèle, immatriculation…"
            className="pl-9"
            aria-label="Rechercher une voiture"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="grid gap-4 p-5">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title="Aucune voiture pour le moment"
          description="Ajoutez votre première voiture pour commencer à enregistrer des locations."
          action={
            <Button onClick={() => openCarForm()}>
              <Plus />
              Ajouter une voiture
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Aucune voiture ne correspond à votre recherche ou au filtre choisi."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((car) => (
            <CarCard key={car.id} car={car} rentals={rentals} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarCard({ car, rentals, today }: { car: Car; rentals: Rental[]; today: DateKey }) {
  const { openCarForm } = useDialogs();
  const { requestDelete } = useCarActions();
  const current = rentals.find((r) => r.carId === car.id && r.status === "en cours");
  const next = rentals
    .filter((r) => r.carId === car.id && r.status === "à venir")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/voitures/${car.id}`} className="block truncate font-semibold hover:text-primary">
            {carName(car)}
          </Link>
          <p className="mt-1 inline-block rounded border bg-secondary px-1.5 py-0.5 font-mono text-xs tracking-wide">
            {car.plate}
          </p>
        </div>
        <CarStatusBadge status={car.status} />
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-secondary/60 p-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Prix/jour</dt>
          <dd className="mt-0.5 font-medium">{formatDT(car.dailyPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Kilométrage</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-medium">
            <Gauge className="size-3.5 text-muted-foreground" />
            {formatKm(car.mileage)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Année · couleur</dt>
          <dd className="mt-0.5 truncate font-medium">
            {car.year} · {car.color}
          </dd>
        </div>
      </dl>

      <div className="grid gap-1.5 text-sm">
        {current ? (
          <p className="flex items-center gap-2 text-blue-800">
            <KeyRound className="size-4 shrink-0" />
            <span className="truncate">
              Louée à <span className="font-medium">{current.clientName}</span> · retour {relativeDay(current.endDate, today)}
            </span>
          </p>
        ) : null}
        <p className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          <span className="truncate">
            {next
              ? `Prochaine location : ${formatDate(next.startDate, "EEE d MMM")} (${next.clientName})`
              : "Aucune location à venir"}
          </span>
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t pt-4">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/voitures/${car.id}`}>
            <Eye />
            Détails
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => openCarForm(car)}>
          <Pencil />
          Modifier
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Supprimer ${carName(car)}`}
          className="text-muted-foreground hover:bg-rose-50 hover:text-destructive"
          onClick={() => requestDelete(car)}
        >
          <Trash2 />
        </Button>
      </div>
    </Card>
  );
}
