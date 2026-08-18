"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SKU_LABEL } from "@/lib/roi/defaults";
import { chartCaption } from "@/lib/roi/format";
import type { ModelInputs, SkuId, SkuInputs, SkuResult } from "@/lib/roi/types";
import { skuState } from "@/lib/roi/types";

import { KpiStrip } from "./kpi-strip";
import { PnlChart } from "./pnl-chart";
import { SensitivityMatrix } from "./sensitivity-matrix";
import { SkuPrimaryInputs } from "./sku-primary-inputs";
import { YearlyDisclosure } from "./yearly-disclosure";

export function GpuTab({
  skuId,
  inputs,
  result,
  onSkuChange,
}: {
  skuId: SkuId;
  inputs: ModelInputs;
  result: SkuResult;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
}) {
  const sku = skuState(inputs, skuId);
  const caption = chartCaption(inputs, result.skuLabel, skuId);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{SKU_LABEL[skuId]}</CardTitle>
          <CardDescription>
            {skuId === "gb300"
              ? "Rack price, GPU rent, utilization, and rack count. Edits this SKU only."
              : "Server price, GPU rent, and utilization. Edits this SKU only."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkuPrimaryInputs
            skuId={skuId}
            sku={sku}
            onChange={(patch) => onSkuChange(skuId, patch)}
          />
        </CardContent>
      </Card>
      <KpiStrip result={result} />
      <Card>
        <CardHeader>
          <CardTitle>P&L and cumulative NCF ($)</CardTitle>
          <CardDescription>{caption}</CardDescription>
        </CardHeader>
        <CardContent>
          <PnlChart result={result} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Breakeven month</CardTitle>
          <CardDescription>{caption}</CardDescription>
        </CardHeader>
        <CardContent>
          <SensitivityMatrix inputs={inputs} skuId={skuId} />
        </CardContent>
      </Card>
      <YearlyDisclosure result={result} />
    </div>
  );
}
