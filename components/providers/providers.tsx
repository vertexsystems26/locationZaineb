"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { DataProvider } from "@/components/providers/data-provider";
import { DialogsProvider } from "@/components/providers/dialogs-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Chargé à la demande : le SDK Firebase ne doit jamais être évalué côté serveur (Workers).
    import("@/lib/firebase")
      .then(({ initAnalytics }) => initAnalytics())
      .catch(() => {});
  }, []);

  return (
    <DataProvider>
      <DialogsProvider>{children}</DialogsProvider>
      <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
    </DataProvider>
  );
}
