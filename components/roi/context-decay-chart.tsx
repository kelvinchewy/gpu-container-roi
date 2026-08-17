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
import { OPEX_BREAK_EVEN_PER_GPU_HR, PRICE_CHART } from "@/lib/roi/listed-forecast";

function yDomain(values: (number | null)[], extras: number[] = []): [number, number] {
  const nums = [...values.filter((v): v is number => v != null), ...extras];
  if (nums.length === 0) return [0, 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pad = (max - min) * 0.15 || 0.05;
  return [Math.max(0, min - pad), max + pad];
}

function SkuPriceChart({
  listedKey,
  forecastKey,
  listedColor,
  opexBe,
  connectGaps,
}: {
  listedKey: "sku5090" | "pro6000";
  forecastKey: "sku5090Forecast" | "pro6000Forecast";
  listedColor: string;
  opexBe: number | null;
  connectGaps: boolean;
}) {
  const config = {
    [listedKey]: { label: listedKey === "sku5090" ? "RTX 5090" : "Pro 6000", color: listedColor },
    [forecastKey]: { label: "Forecast", color: "var(--chart-forecast)" },
  } satisfies ChartConfig;

  const domain = yDomain(
    PRICE_CHART.flatMap((row) => [row[listedKey], row[forecastKey]]),
    opexBe == null ? [] : [opexBe],
  );

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
        {opexBe != null ? (
          <ReferenceLine y={opexBe} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
        ) : null}
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
          dataKey={forecastKey}
          stroke={`var(--color-${forecastKey})`}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot
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
        forecastKey="sku5090Forecast"
        listedColor="var(--chart-2)"
        opexBe={OPEX_BREAK_EVEN_PER_GPU_HR}
        connectGaps={false}
      />
      <SkuPriceChart
        listedKey="pro6000"
        forecastKey="pro6000Forecast"
        listedColor="var(--chart-1)"
        opexBe={null}
        connectGaps
      />
    </div>
  );
}
