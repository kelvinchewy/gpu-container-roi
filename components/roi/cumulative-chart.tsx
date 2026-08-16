"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

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

const config: ChartConfig = {
  a: { label: "RTX 5090", color: "var(--chart-3)" },
  b: { label: "Pro 6000", color: "var(--chart-1)" },
  cum: { label: "Cumulative NCF", color: "var(--chart-1)" },
};

export function CumulativeChart({
  series,
}: {
  series: { id: string; label: string; result: SkuResult }[];
}) {
  const n = Math.max(...series.map((s) => s.result.cashFlows.length));
  const data = Array.from({ length: n }, (_, t) => {
    const row: Record<string, string | number> = { year: `Y${t}` };
    for (const s of series) {
      let cum = 0;
      for (let i = 0; i <= t; i++) cum += s.result.cashFlows[i] ?? 0;
      row[s.id] = cum;
    }
    return row;
  });

  return (
    <ChartContainer config={config} className="aspect-[16/7] w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
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
        {series.map((s) => (
          <Line
            key={s.id}
            type="linear"
            dataKey={s.id}
            stroke={`var(--color-${s.id})`}
            strokeWidth={2}
            dot={false}
            name={s.label}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
