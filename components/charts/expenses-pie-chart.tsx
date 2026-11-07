"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/charts/chart-tooltip";
import { CHART } from "@/lib/constants";
import { formatDT } from "@/lib/format";
import { sum } from "@/lib/utils";
import type { CategorySlice } from "@/lib/finance";

const percent = new Intl.NumberFormat("fr-TN", { style: "percent", maximumFractionDigits: 1 });

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: CategorySlice }>;
}

function SliceTooltip({ active, payload }: TooltipProps) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;
  return (
    <ChartTooltipBox title={slice.label}>
      <ChartTooltipRow color={slice.color} label="Montant" value={formatDT(slice.value)} strong />
      <ChartTooltipRow label="Part des dépenses" value={percent.format(slice.share)} />
    </ChartTooltipBox>
  );
}

/**
 * Camembert (anneau) des dépenses par catégorie. Couleur fixe par catégorie ;
 * la légende chiffrée sert aussi de vue tableau (identité jamais portée par la couleur seule).
 */
export function ExpensesPieChart({ data }: { data: CategorySlice[] }) {
  const total = sum(data.map((d) => d.value));
  const chartData = data.map((d) => ({ ...d, fill: d.color }));

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              stroke={CHART.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            />
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-semibold">{formatDT(total)}</span>
        </div>
      </div>
      <ul className="grid gap-2 text-sm">
        {data.map((slice) => (
          <li key={slice.category} className="flex items-center gap-3">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: slice.color }} aria-hidden />
            <span className="flex-1 truncate">{slice.label}</span>
            <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">
              {percent.format(slice.share)}
            </span>
            <span className="w-28 text-right font-medium tabular-nums">{formatDT(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
