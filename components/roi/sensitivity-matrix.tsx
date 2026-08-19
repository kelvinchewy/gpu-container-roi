"use client";

import { useMemo } from "react";

import { MATRIX_DECAY, MATRIX_UTILS } from "@/lib/roi/defaults";
import { monthLabel } from "@/lib/roi/format";
import { breakevenMatrix, nearestIndex } from "@/lib/roi/matrix";
import type { ModelInputs, SkuId } from "@/lib/roi/types";
import { skuState } from "@/lib/roi/types";
import { cn } from "@/lib/utils";

import { useT } from "./locale";

function cellTint(month: number | null, min: number, max: number): string {
  if (month == null) return "bg-muted text-muted-foreground";
  const span = Math.max(max - min, 1);
  const t = (month - min) / span;
  if (t <= 0.2) return "bg-primary/25";
  if (t <= 0.4) return "bg-primary/15";
  if (t <= 0.6) return "bg-primary/10";
  if (t <= 0.8) return "bg-accent";
  return "text-muted-foreground";
}

export function SensitivityMatrix({
  inputs,
  skuId,
}: {
  inputs: ModelInputs;
  skuId: SkuId;
}) {
  const grid = useMemo(() => breakevenMatrix(inputs, skuId), [inputs, skuId]);
  const months = grid.flat().filter((m): m is number => m != null);
  const min = months.length ? Math.min(...months) : 0;
  const max = months.length ? Math.max(...months) : 1;

  const sku = skuState(inputs, skuId);
  const utilIndex = nearestIndex(MATRIX_UTILS, sku.utilization);
  const decayTarget = inputs.priceErosionOn ? inputs.priceErosionRate : 0;
  const decayIndex = nearestIndex(MATRIX_DECAY, decayTarget);
  const { t } = useT();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-xs">
        <caption className="sr-only">
          {t("matrixCaption")}
        </caption>
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground" />
            <th
              colSpan={MATRIX_UTILS.length}
              className="p-2 font-medium text-muted-foreground"
            >
              {t("matrixUtil")}
            </th>
          </tr>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground">
              {t("matrixDecay")}
            </th>
            {MATRIX_UTILS.map((u) => (
              <th key={u} className="p-2 font-medium text-muted-foreground">
                {(u * 100).toFixed(0)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MATRIX_DECAY.map((decay, ri) => (
            <tr key={decay}>
              <td className="p-2 text-left font-mono text-muted-foreground">
                {t("matrixDecayYr", { value: (decay * 100).toFixed(0) })}
              </td>
              {MATRIX_UTILS.map((_, ci) => {
                const month = grid[ri][ci];
                const active = ri === decayIndex && ci === utilIndex;
                return (
                  <td
                    key={ci}
                    className={cn(
                      "p-2 font-mono tabular-nums",
                      cellTint(month, min, max),
                      active && "ring-2 ring-ring ring-inset",
                    )}
                  >
                    {monthLabel(month)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
