import { DEFAULT_INPUTS, DEFAULT_SKU_5090, DEFAULT_SKU_PRO6000 } from "./defaults";
import { runModel } from "./engine";
import { PRICE_LEVELS } from "./sources";
import type { SkuResult } from "./types";

function opexPerGpuHr(sku: SkuResult, hoursPerYear: number, utilization: number): number {
  const y1 = sku.years[0];
  const gpuHours = sku.totalGpus * hoursPerYear * utilization;
  if (!y1 || gpuHours <= 0) return 0;
  return y1.totalOpex / gpuHours;
}

const reset = runModel(DEFAULT_INPUTS);

/** Y1 OpEx / GPU-hours at Reset. Not listed rent. Does not feed `runModel`. */
export const OPEX_PER_GPU_HR = {
  sku5090: opexPerGpuHr(
    reset.sku5090,
    DEFAULT_INPUTS.hoursPerYear,
    DEFAULT_SKU_5090.utilization,
  ),
  pro6000: opexPerGpuHr(
    reset.skuPro6000,
    DEFAULT_INPUTS.hoursPerYear,
    DEFAULT_SKU_PRO6000.utilization,
  ),
} as const;

/** Listed prints only. OpEx is a flat cost line on each chart. */
export const PRICE_CHART = PRICE_LEVELS.map((p) => ({
  m: p.m,
  sku5090: p.sku5090,
  pro6000: p.pro6000,
  opex5090: OPEX_PER_GPU_HR.sku5090,
  opexPro6000: OPEX_PER_GPU_HR.pro6000,
}));
