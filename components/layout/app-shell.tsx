"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  CalendarDays,
  CarFront,
  CircleAlert,
  KeyRound,
  LayoutDashboard,
  Menu,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { useData } from "@/components/providers/data-provider";
import { useDialogs } from "@/components/providers/dialogs-context";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/voitures", label: "Voitures", icon: CarFront },
  { href: "/locations", label: "Locations", icon: KeyRound },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/finances", label: "Finances", icon: Wallet },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CarFront className="size-[18px]" />
      </span>
      <span>{APP_NAME}</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { cars } = useData();
  const rentedCount = cars.filter((c) => c.status === "loué").length;

  return (
    <nav className="grid gap-1" aria-label="Navigation principale">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {href === "/voitures" && cars.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {rentedCount}/{cars.length}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { openRentalForm } = useDialogs();
  const { error } = useData();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <Brand />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          onNavigate?.();
          openRentalForm();
        }}
      >
        <Plus />
        Nouvelle location
      </Button>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto grid gap-3">
        {error && (
          <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <CircleAlert className="size-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <p className="px-2 text-xs text-muted-foreground">Données synchronisées en temps réel</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { openRentalForm } = useDialogs();

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Sidebar ordinateur */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <SidebarBody />
      </aside>

      {/* Barre supérieure mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Trigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </DialogPrimitive.Trigger>
          <SheetContent aria-describedby={undefined}>
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Dialog>
        <div className="flex-1">
          <Brand />
        </div>
        <Button size="icon" aria-label="Nouvelle location" onClick={() => openRentalForm()}>
          <Plus />
        </Button>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
