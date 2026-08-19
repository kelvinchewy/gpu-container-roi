"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

import { useT } from "./locale";

export function OpexChart({ result }: { result: SkuResult }) {
  const { t } = useT();
  const config: ChartConfig = {
    electricity: { label: t("chartElectricity"), color: "var(--chart-1)" },
    network: { label: t("chartNetwork"), color: "var(--chart-2)" },
    om: { label: t("chartOm"), color: "var(--chart-3)" },
    insurance: { label: t("chartInsurance"), color: "var(--chart-4)" },
    propertyTax: { label: t("chartPropertyTax"), color: "var(--chart-5)" },
    otherOpex: { label: t("chartOther"), color: "var(--muted-foreground)" },
  };
  const data = result.years.map((y) => ({
    year: `Y${y.year}`,
    electricity: y.electricity,
    network: y.network,
    om: y.om,
    insurance: y.insurance,
    propertyTax: y.propertyTax,
    otherOpex: y.otherOpex,
  }));

  return (
    <ChartContainer config={config} className="aspect-[16/6] w-full">
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={false} className="font-mono" />
        <YAxis
          tickLine={false}
          axisLine={false}
          className="font-mono"
          tickFormatter={(v) => usdK(Number(v))}
          width={72}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="electricity" stackId="a" fill="var(--color-electricity)" />
        <Bar dataKey="network" stackId="a" fill="var(--color-network)" />
        <Bar dataKey="om" stackId="a" fill="var(--color-om)" />
        <Bar dataKey="insurance" stackId="a" fill="var(--color-insurance)" />
        <Bar dataKey="propertyTax" stackId="a" fill="var(--color-propertyTax)" />
        <Bar dataKey="otherOpex" stackId="a" fill="var(--color-otherOpex)" />
      </BarChart>
    </ChartContainer>
  );
}
