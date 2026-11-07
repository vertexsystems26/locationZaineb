"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/charts/chart-tooltip";
import { CHART } from "@/lib/constants";
import { formatCompact, formatDT } from "@/lib/format";
import type { MonthPoint } from "@/lib/finance";

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthPoint }>;
}

function MonthTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <ChartTooltipBox title={point.fullLabel}>
      <ChartTooltipRow color={CHART.income} label="Entrées" value={formatDT(point.income)} />
      <ChartTooltipRow color={CHART.expense} label="Sorties" value={formatDT(point.expense)} />
      <div className="my-0.5 border-t" />
      <ChartTooltipRow label="Bénéfice" value={formatDT(point.net)} strong />
    </ChartTooltipBox>
  );
}

/** Entrées vs sorties par mois : barres groupées, 24 px max, coins arrondis côté valeur. */
export function IncomeExpenseChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Graphique des entrées et sorties par mois">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 8, right: 4, left: -4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART.axis }}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            tickFormatter={(v: number) => formatCompact(v)}
            width={52}
          />
          <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} content={<MonthTooltip />} />
          <Bar dataKey="income" name="Entrées" fill={CHART.income} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar dataKey="expense" name="Sorties" fill={CHART.expense} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
