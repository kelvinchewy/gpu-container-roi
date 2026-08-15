"use client";

import { useMemo } from "react";

import { MATRIX_DECAY, MATRIX_UTILS } from "@/lib/roi/defaults";
import { breakevenMatrix, nearestIndex } from "@/lib/roi/matrix";
import { monthLabel } from "@/lib/roi/format";
import type { ModelInputs, SkuId } from "@/lib/roi/types";
import { cn } from "@/lib/utils";

function cellTint(month: number | null, min: number, max: number): string {
  if (month == null) return "bg-muted text-muted-foreground";
  const span = Math.max(max - min, 1);
  const t = (month - min) / span;
  if (t <= 0.2) return "bg-primary/20";
  if (t <= 0.4) return "bg-primary/15";
  if (t <= 0.6) return "bg-primary/10";
  if (t <= 0.8) return "bg-muted";
  return "bg-destructive/10";
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

  const sku = skuId === "5090" ? inputs.sku5090 : inputs.skuPro6000;
  const utilIndex = nearestIndex(MATRIX_UTILS, sku.utilization);
  const decayTarget = inputs.priceErosionOn ? inputs.priceErosionRate : 0;
  const decayIndex = nearestIndex(MATRIX_DECAY, decayTarget);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground">
              Price decay
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
                {(decay * 100).toFixed(0)}%/yr
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
