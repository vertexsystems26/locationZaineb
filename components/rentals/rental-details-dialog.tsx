"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { Ban, CalendarDays, CarFront, Pencil, Phone, StickyNote, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RentalStatusBadge } from "@/components/shared/status-badge";
import { useDialogs } from "@/components/providers/dialogs-context";
import { useRentalActions } from "@/hooks/use-actions";
import { useRentals } from "@/hooks/use-rentals";
import { useCarsById } from "@/hooks/use-cars";
import { formatDate, formatDateTime, relativeDay } from "@/lib/dates";
import { formatDT, pluralize } from "@/lib/format";

export function RentalDetailsDialog({
  open,
  onOpenChange,
  rentalId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalId: string | null;
}) {
  const { rentals, today } = useRentals();
  const carsById = useCarsById();
  const { openRentalForm } = useDialogs();
  const { requestCancel, requestDelete } = useRentalActions();

  // Lecture en direct : la fenêtre reflète les modifications faites ailleurs.
  const rental = rentals.find((r) => r.id === rentalId);
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open && Boolean(rental)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {rental && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle>Location — {rental.clientName}</DialogTitle>
                <RentalStatusBadge status={rental.status} />
              </div>
              <DialogDescription>
                {rental.status === "à venir" && `Départ ${relativeDay(rental.startDate, today)}`}
                {rental.status === "en cours" && `Retour prévu ${relativeDay(rental.endDate, today)}`}
                {rental.status === "terminée" && `Terminée le ${formatDate(rental.endDate)}`}
                {rental.status === "annulée" && "Cette location a été annulée."}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid gap-3 text-sm">
              <DetailRow icon={CarFront} label="Voiture">
                {carsById.has(rental.carId) ? (
                  <Link
                    href={`/voitures/${rental.carId}`}
                    onClick={close}
                    className="font-medium text-primary hover:underline"
                  >
                    {rental.carLabel}
                  </Link>
                ) : (
                  <span className="font-medium">{rental.carLabel} (supprimée)</span>
                )}
              </DetailRow>
              <DetailRow icon={User} label="Client">
                <span className="font-medium">{rental.clientName}</span>
              </DetailRow>
              <DetailRow icon={Phone} label="Téléphone">
                <a href={`tel:${rental.clientPhone.replace(/\s/g, "")}`} className="font-medium text-primary hover:underline">
                  {rental.clientPhone}
                </a>
              </DetailRow>
              <DetailRow icon={CalendarDays} label="Période">
                <span className="font-medium">
                  {formatDate(rental.startDate, "EEE d MMM yyyy")} → {formatDate(rental.endDate, "EEE d MMM yyyy")}
                </span>
                <span className="text-muted-foreground"> · {pluralize(rental.days, "jour")}</span>
              </DetailRow>
              {rental.notes && (
                <DetailRow icon={StickyNote} label="Notes">
                  <span className="whitespace-pre-line">{rental.notes}</span>
                </DetailRow>
              )}
            </dl>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/70 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Prix par jour</p>
                <p className="mt-0.5 font-semibold">{formatDT(rental.dailyPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-0.5 text-lg font-semibold text-primary">{formatDT(rental.totalPrice)}</p>
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">Créée le {formatDateTime(rental.createdAt)}</p>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                className="text-destructive hover:bg-rose-50 hover:text-destructive"
                onClick={() => requestDelete(rental, close)}
              >
                <Trash2 />
                Supprimer
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {(rental.status === "à venir" || rental.status === "en cours") && (
                  <Button variant="outline" onClick={() => requestCancel(rental)}>
                    <Ban />
                    Annuler la location
                  </Button>
                )}
                {rental.status !== "annulée" && (
                  <Button
                    onClick={() => {
                      close();
                      openRentalForm({ rental });
                    }}
                  >
                    <Pencil />
                    Modifier
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
