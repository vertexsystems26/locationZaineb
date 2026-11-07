"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipBox, ChartTooltipRow } from "@/components/charts/chart-tooltip";
import { CHART } from "@/lib/constants";
import { formatCompact, formatDT } from "@/lib/format";
import type { BalancePoint } from "@/lib/finance";

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: BalancePoint }>;
}

function BalanceTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <ChartTooltipBox title={point.fullLabel}>
      <ChartTooltipRow color={CHART.balance} label="Solde cumulé" value={formatDT(point.balance)} strong />
      <ChartTooltipRow label="Variation" value={`${point.net > 0 ? "+" : ""}${formatDT(point.net)}`} />
    </ChartTooltipBox>
  );
}

/** Évolution du solde cumulé (une seule série : pas de légende, le titre la nomme). */
export function BalanceChart({ data }: { data: BalancePoint[] }) {
  const hasNegative = data.some((d) => d.balance < 0);
  return (
    <div className="h-64 w-full" role="img" aria-label="Évolution du solde sur la période">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART.axis }}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART.muted, fontSize: 12 }}
            tickFormatter={(v: number) => formatCompact(v)}
            width={52}
          />
          {hasNegative && <ReferenceLine y={0} stroke={CHART.axis} />}
          <Tooltip cursor={{ stroke: CHART.axis, strokeWidth: 1 }} content={<BalanceTooltip />} />
          <Area
            type="linear"
            dataKey="balance"
            stroke={CHART.balance}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={CHART.balance}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4, fill: CHART.balance, stroke: CHART.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
