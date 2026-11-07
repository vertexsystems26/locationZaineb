"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { DataProvider } from "@/components/providers/data-provider";
import { DialogsProvider } from "@/components/providers/dialogs-provider";
import { initAnalytics } from "@/lib/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void initAnalytics();
  }, []);

  return (
    <DataProvider>
      <DialogsProvider>{children}</DialogsProvider>
      <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
    </DataProvider>
  );
}
