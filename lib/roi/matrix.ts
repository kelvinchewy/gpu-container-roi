import { MATRIX_DECAY, MATRIX_UTILS } from "./defaults";
import { runSkuModel } from "./engine";
import type { ModelInputs, SkuId } from "./types";
import { SKU_STATE_KEY } from "./types";

export function breakevenMatrix(inputs: ModelInputs, skuId: SkuId): (number | null)[][] {
  return MATRIX_DECAY.map((decay) =>
    MATRIX_UTILS.map((utilization) => {
      const skuKey = SKU_STATE_KEY[skuId];
      const next: ModelInputs = {
        ...inputs,
        priceErosionOn: decay > 0,
        priceErosionRate: decay,
        [skuKey]: { ...inputs[skuKey], utilization },
      };
      return runSkuModel(next, skuId).breakevenMonth;
    }),
  );
}

export function nearestIndex(values: readonly number[], target: number): number {
  let best = 0;
  let bestDist = Infinity;
  values.forEach((value, i) => {
    const dist = Math.abs(value - target);
    if (dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  });
  return best;
}
