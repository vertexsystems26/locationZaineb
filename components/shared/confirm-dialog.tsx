"use client";

import * as React from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ConfirmOptions } from "@/components/providers/dialogs-context";
import { getErrorMessage } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ConfirmOptions | null;
}) {
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    if (!options) return;
    setPending(true);
    try {
      await options.onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            {options?.destructive && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <TriangleAlert className="size-[18px]" />
              </span>
            )}
            <div className="grid gap-1.5">
              <AlertDialogTitle>{options?.title}</AlertDialogTitle>
              {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Retour</AlertDialogCancel>
          <Button
            variant={options?.destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending && <LoaderCircle className="animate-spin" />}
            {options?.confirmLabel ?? "Confirmer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
