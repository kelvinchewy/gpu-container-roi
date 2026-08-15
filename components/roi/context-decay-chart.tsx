"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PRICE_LEVELS } from "@/lib/roi/sources";

const config = {
  sku5090: { label: "RTX 5090", color: "var(--chart-2)" },
  pro6000: { label: "Pro 6000", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ContextDecayChart() {
  return (
    <ChartContainer config={config} className="aspect-[16/7] w-full">
      <LineChart data={[...PRICE_LEVELS]} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="m" tickLine={false} axisLine={false} className="font-mono" />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="font-mono"
          tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span>{String(name)}</span>
                  <span className="font-mono">${Number(value).toFixed(2)}</span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="linear"
          dataKey="sku5090"
          stroke="var(--color-sku5090)"
          strokeWidth={2}
          dot
        />
        <Line
          type="linear"
          dataKey="pro6000"
          stroke="var(--color-pro6000)"
          strokeWidth={2}
          dot
        />
      </LineChart>
    </ChartContainer>
  );
}
