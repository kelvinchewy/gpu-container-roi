"use client";

import { Card, CardContent } from "@/components/ui/card";
import { monthLabel, usd, years } from "@/lib/roi/format";
import type { SkuResult } from "@/lib/roi/types";

import { useT } from "./locale";

export function KpiStrip({ result }: { result: SkuResult }) {
  const { t, locale } = useT();
  const residualYear = result.years.length;
  const items = [
    { label: t("capex"), value: usd(result.totalCapex) },
    { label: t("y1Ncf"), value: usd(result.y1Ncf) },
    { label: t("payback"), value: years(result.paybackYears, 2, locale) },
    { label: t("irr"), value: result.irr == null ? "—" : `${(result.irr * 100).toFixed(2)}%` },
    { label: t("npv"), value: usd(result.npv) },
    { label: t("residualYn", { n: residualYear }), value: usd(result.residualCash) },
    { label: t("breakevenMonth"), value: monthLabel(result.breakevenMonth) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="grid gap-1">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="font-mono text-sm font-medium tabular-nums">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
