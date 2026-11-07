"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RentalsTable } from "@/components/rentals/rentals-table";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useCars } from "@/hooks/use-cars";
import { useRentals } from "@/hooks/use-rentals";
import { RENTAL_STATUS_META } from "@/lib/constants";
import { formatDT, pluralize } from "@/lib/format";
import { carLabel } from "@/lib/rental-logic";
import { sum } from "@/lib/utils";
import { RENTAL_STATUSES, type RentalStatus } from "@/types";

export function RentalsView() {
  const { rentals, loading } = useRentals();
  const { cars } = useCars();
  const { openRentalForm } = useDialogs();

  const [status, setStatus] = useState<RentalStatus | "all">("all");
  const [carId, setCarId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const hasFilters = status !== "all" || carId || from || to || search;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rentals.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (carId && r.carId !== carId) return false;
      // Période : location qui chevauche l'intervalle choisi.
      if (from && r.endDate < from) return false;
      if (to && r.startDate > to) return false;
      if (q && !`${r.clientName} ${r.clientPhone} ${r.carLabel}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rentals, status, carId, from, to, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rentals.length };
    for (const s of RENTAL_STATUSES) map[s] = rentals.filter((r) => r.status === s).length;
    return map;
  }, [rentals]);

  const revenue = sum(filtered.filter((r) => r.status !== "annulée").map((r) => r.totalPrice));

  function reset() {
    setStatus("all");
    setCarId("");
    setFrom("");
    setTo("");
    setSearch("");
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Locations"
        description="Toutes les locations, passées, en cours et à venir."
        actions={
          <Button onClick={() => openRentalForm()}>
            <Plus />
            Nouvelle location
          </Button>
        }
      />

      <Card className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.9fr_0.9fr]">
          <div className="grid gap-1.5">
            <Label htmlFor="f-search">Recherche</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="f-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Client, téléphone…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-status">Statut</Label>
            <Select id="f-status" value={status} onChange={(e) => setStatus(e.target.value as RentalStatus | "all")}>
              <option value="all">Tous les statuts ({counts.all})</option>
              {RENTAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RENTAL_STATUS_META[s].label} ({counts[s] ?? 0})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-car">Voiture</Label>
            <Select id="f-car" value={carId} onChange={(e) => setCarId(e.target.value)}>
              <option value="">Toutes les voitures</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {carLabel(c)}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-from">Du</Label>
            <Input id="f-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-to">Au</Label>
            <Input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground">
            {pluralize(filtered.length, "location")} · <span className="font-medium text-foreground">{formatDT(revenue)}</span>{" "}
            hors annulations
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw />
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {!loading && rentals.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="Aucune location enregistrée"
          description={
            cars.length
              ? "Créez votre première location : son montant sera ajouté automatiquement aux finances."
              : "Ajoutez d'abord une voiture depuis la page Voitures."
          }
          action={
            cars.length ? (
              <Button onClick={() => openRentalForm()}>
                <Plus />
                Nouvelle location
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <RentalsTable
            rentals={filtered}
            loading={loading}
            emptyText="Aucune location ne correspond à ces filtres."
          />
        </Card>
      )}
    </div>
  );
}
