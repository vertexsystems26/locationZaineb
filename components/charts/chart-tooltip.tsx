import * as React from "react";

/** Conteneur commun des info-bulles de graphiques (texte en encre neutre, pastille = identité). */
export function ChartTooltipBox({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-44 rounded-lg border bg-card px-3 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-foreground first-letter:uppercase">{title}</p>
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

export function ChartTooltipRow({
  color,
  label,
  value,
  strong,
}: {
  color?: string;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-muted-foreground">
        {color && <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />}
        {label}
      </span>
      <span className={strong ? "font-semibold tabular-nums text-foreground" : "tabular-nums text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}
