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
import { PRICE_CHART } from "@/lib/roi/listed-forecast";

function yDomain(values: (number | null)[]): [number, number] {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return [0, 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pad = (max - min) * 0.15 || 0.05;
  return [Math.max(0, min - pad), max + pad];
}

function SkuPriceChart({
  listedKey,
  opexKey,
  listedColor,
  connectGaps,
}: {
  listedKey: "sku5090" | "pro6000";
  opexKey: "opex5090" | "opexPro6000";
  listedColor: string;
  connectGaps: boolean;
}) {
  const config = {
    [listedKey]: { label: "Listed", color: listedColor },
    [opexKey]: { label: "OpEx", color: "var(--muted-foreground)" },
  } satisfies ChartConfig;

  const domain = yDomain(PRICE_CHART.flatMap((row) => [row[listedKey], row[opexKey]]));

  return (
    <ChartContainer config={config} className="aspect-[16/8] min-h-[220px] w-full">
      <LineChart data={PRICE_CHART} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="m"
          tickLine={false}
          axisLine={false}
          className="font-mono tabular-nums"
          minTickGap={8}
          interval="equidistantPreserveStart"
        />
        <YAxis
          type="number"
          tickLine={false}
          axisLine={false}
          className="font-mono tabular-nums"
          tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
          width={48}
          domain={domain}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) =>
                value == null ? null : (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span>{String(name)}</span>
                    <span className="font-mono tabular-nums">${Number(value).toFixed(2)}</span>
                  </div>
                )
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="linear"
          dataKey={listedKey}
          stroke={`var(--color-${listedKey})`}
          strokeWidth={2}
          dot
          connectNulls={connectGaps}
        />
        <Line
          type="linear"
          dataKey={opexKey}
          stroke={`var(--color-${opexKey})`}
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}

export function ContextDecayChart() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SkuPriceChart
        listedKey="sku5090"
        opexKey="opex5090"
        listedColor="var(--chart-2)"
        connectGaps={false}
      />
      <SkuPriceChart
        listedKey="pro6000"
        opexKey="opexPro6000"
        listedColor="var(--chart-1)"
        connectGaps
      />
    </div>
  );
}
