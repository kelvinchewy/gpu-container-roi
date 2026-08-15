"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usdK } from "@/lib/roi/format";
import type { SkuResult } from "@/lib/roi/types";

const pnlConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-2)" },
  opex: { label: "OpEx", color: "var(--chart-1)" },
  ncf: { label: "NCF", color: "var(--chart-3)" },
};

const cumConfig: ChartConfig = {
  cumulative: { label: "Cumulative NCF", color: "var(--chart-4)" },
};

export function PnlChart({ result }: { result: SkuResult }) {
  const data = [
    {
      year: "Y0",
      revenue: 0,
      opex: 0,
      ncf: 0,
      cumulative: result.cashFlows[0] ?? 0,
    },
    ...result.years.map((y) => ({
      year: `Y${y.year}`,
      revenue: y.revenue,
      opex: y.totalOpex,
      ncf: y.ncf,
      cumulative: y.cumulative,
    })),
  ];

  return (
    <div className="grid gap-1">
      <ChartContainer config={pnlConfig} className="aspect-[16/5] w-full">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }} syncId="pnl-cum">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="font-mono"
            tickFormatter={(v) => usdK(Number(v))}
            width={72}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={2} />
          <Bar dataKey="opex" fill="var(--color-opex)" radius={2} />
          <Bar dataKey="ncf" fill="var(--color-ncf)" radius={2} />
        </BarChart>
      </ChartContainer>
      <ChartContainer config={cumConfig} className="aspect-[16/4] w-full">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 4 }} syncId="pnl-cum">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} className="font-mono" />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="font-mono"
            tickFormatter={(v) => usdK(Number(v))}
            width={72}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="linear"
            dataKey="cumulative"
            stroke="var(--color-cumulative)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-cumulative)", strokeWidth: 0 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
