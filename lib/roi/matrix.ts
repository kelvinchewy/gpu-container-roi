import { DEFAULT_GB300_FACILITY, MATRIX_DECAY, MATRIX_UTILS } from "./defaults";
import { runSkuModel } from "./engine";
import type { ModelInputs, SkuId } from "./types";
import { SKU_STATE_KEY } from "./types";

/** Inputs that change a matrix cell for one SKU. Locale / UI chrome do not belong here. */
function matrixKey(inputs: ModelInputs, skuId: SkuId): string {
  const sku = inputs[SKU_STATE_KEY[skuId]];
  if (skuId === "gb300") {
    const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
    return JSON.stringify({
      skuId,
      discountRate: inputs.discountRate,
      serverPrice: sku.serverPrice,
      gpuRentPerHr: sku.gpuRentPerHr,
      itLoadKw: sku.itLoadKw,
      residualPct: sku.residualPct,
      rackCount: sku.rackCount ?? null,
      gpusPerServer: sku.gpusPerServer ?? null,
      f: {
        elecPerKwh: f.elecPerKwh,
        federalTax: f.federalTax,
        stateTax: f.stateTax,
        propertyTaxPctCapex: f.propertyTaxPctCapex,
        obbbaEnabled: f.obbbaEnabled,
        pue: f.pue,
        hoursPerYear: f.hoursPerYear,
        usefulLifeYrs: f.usefulLifeYrs,
        hallCount: f.hallCount,
        containerCost: f.containerCost,
        siteConstruction: f.siteConstruction,
        networkOpexMo: f.networkOpexMo,
        omOpexMo: f.omOpexMo,
        insurancePctRev: f.insurancePctRev,
        otherOpexPctRev: f.otherOpexPctRev,
      },
    });
  }
  return JSON.stringify({
    skuId,
    discountRate: inputs.discountRate,
    elecPerKwh: inputs.elecPerKwh,
    federalTax: inputs.federalTax,
    stateTax: inputs.stateTax,
    propertyTaxPctCapex: inputs.propertyTaxPctCapex,
    obbbaEnabled: inputs.obbbaEnabled,
    pue: inputs.pue,
    hoursPerYear: inputs.hoursPerYear,
    usefulLifeYrs: inputs.usefulLifeYrs,
    containerCount: inputs.containerCount,
    serversPerContainer: inputs.serversPerContainer,
    gpusPerServer: inputs.gpusPerServer,
    containerCost: inputs.containerCost,
    siteConstruction: inputs.siteConstruction,
    networkOpexMo: inputs.networkOpexMo,
    omOpexMo: inputs.omOpexMo,
    insurancePctRev: inputs.insurancePctRev,
    otherOpexPctRev: inputs.otherOpexPctRev,
    serverPrice: sku.serverPrice,
    gpuRentPerHr: sku.gpuRentPerHr,
    itLoadKw: sku.itLoadKw,
    residualPct: sku.residualPct,
  });
}

const CACHE_MAX = 24;
const cache = new Map<string, (number | null)[][]>();

function cacheGet(key: string): (number | null)[][] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function cacheSet(key: string, grid: (number | null)[][]): void {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, grid);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
}

export function clearMatrixCache(): void {
  cache.clear();
}

export function breakevenMatrix(inputs: ModelInputs, skuId: SkuId): (number | null)[][] {
  const key = matrixKey(inputs, skuId);
  const hit = cacheGet(key);
  if (hit) return hit;

  const grid = MATRIX_DECAY.map((decay) =>
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

  cacheSet(key, grid);
  return grid;
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
