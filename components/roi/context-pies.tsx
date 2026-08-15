"use client";

import { Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CLOUD_APP_SHARE, LISTING_SHARE } from "@/lib/roi/sources";

const listingConfig = {
  sku5090: { label: "RTX 5090", color: "var(--chart-2)" },
  pro6000: { label: "Pro 6000", color: "var(--chart-1)" },
} satisfies ChartConfig;

const appConfig = {
  ai: { label: "AI", color: "var(--chart-1)" },
  analytics: { label: "Analytics", color: "var(--chart-2)" },
  render: { label: "Rendering", color: "var(--chart-3)" },
  science: { label: "Scientific", color: "var(--chart-4)" },
  gaming: { label: "Gaming", color: "var(--chart-5)" },
  other: { label: "Other", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

function PieLegend({
  items,
}: {
  items: readonly { key: string; name: string; fill: string }[];
}) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="size-2 shrink-0 rounded-[2px]" style={{ background: item.fill }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}

function SharePie({
  config,
  data,
}: {
  config: ChartConfig;
  data: readonly { key: string; name: string; value: number; fill: string }[];
}) {
  return (
    <ChartContainer config={config} className="aspect-square max-h-52 w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              hideLabel
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span>{String(name)}</span>
                  <span className="font-mono">{String(value)}%</span>
                </div>
              )}
            />
          }
        />
        <Pie data={[...data]} dataKey="value" nameKey="name" />
      </PieChart>
    </ChartContainer>
  );
}

export function ContextPies() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Cloud listings · 5090 vs Pro 6000</h3>
        <SharePie config={listingConfig} data={LISTING_SHARE} />
        <PieLegend items={LISTING_SHARE} />
        <p className="text-xs text-muted-foreground">
          104 vs 207 listings ·{" "}
          <a
            className="underline underline-offset-4"
            href="https://getdeploying.com/gpus/nvidia-rtx-5090"
          >
            getdeploying 5090
          </a>
          {" · "}
          <a
            className="underline underline-offset-4"
            href="https://getdeploying.com/gpus/nvidia-rtx-pro-6000"
          >
            Pro 6000
          </a>
          {" · "}
          15 Aug 2026 · supply, not demand
        </p>
      </div>
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Cloud GPU $ mix · 2025</h3>
        <SharePie config={appConfig} data={CLOUD_APP_SHARE} />
        <PieLegend items={CLOUD_APP_SHARE} />
        <p className="text-xs text-muted-foreground">
          <a
            className="underline underline-offset-4"
            href="https://dataintelo.com/report/cloud-gpu-instance-market"
          >
            Dataintelo, Cloud GPU Instance Market
          </a>
          {" · "}
          2025 application $ mix · not SKU-specific
        </p>
      </div>
    </div>
  );
}
