import { DEFAULT_INPUTS, DEFAULT_SKU_5090, DEFAULT_SKU_PRO6000 } from "./defaults";
import { PRICE_LEVELS } from "./sources";
import type { ModelInputs, SkuInputs } from "./types";

/** 575 W nameplate × PUE × tariff. Caption floor, not Excel IT load. */
export const ELEC_PER_GPU_HR_TDP =
  0.575 * DEFAULT_INPUTS.pue * DEFAULT_INPUTS.elecPerKwh;

/** Rent that covers OpEx (not CapEx). Insurance / other scale with revenue. */
export function opexBreakEvenPerGpuHr(sku: SkuInputs, inputs: ModelInputs): number {
  const totalServers = inputs.containerCount * inputs.serversPerContainer;
  const totalGpus = totalServers * inputs.gpusPerServer;
  const infraCapex = (inputs.containerCost + inputs.siteConstruction) * inputs.containerCount;
  const totalCapex = totalServers * sku.serverPrice + infraCapex;
  const electricity =
    totalServers * sku.itLoadKw * inputs.pue * inputs.elecPerKwh * inputs.hoursPerYear;
  const network = inputs.networkOpexMo * 12 * inputs.containerCount;
  const om = inputs.omOpexMo * 12 * inputs.containerCount;
  const propertyTax = totalCapex * inputs.propertyTaxPctCapex;
  const fixed = electricity + network + om + propertyTax;
  const denom =
    (1 - inputs.insurancePctRev - inputs.otherOpexPctRev) *
    totalGpus *
    inputs.hoursPerYear *
    sku.utilization;
  if (denom <= 0) return 0;
  return fixed / denom;
}

/** 5090 OpEx BE ~$0.12. Pro 6000 is similar; do not put it on the 6000 Y scale. */
export const OPEX_BREAK_EVEN_PER_GPU_HR = opexBreakEvenPerGpuHr(DEFAULT_SKU_5090, DEFAULT_INPUTS);

export const SUGGESTED_RENT = {
  sku5090: DEFAULT_SKU_5090.gpuRentPerHr,
  pro6000: DEFAULT_SKU_PRO6000.gpuRentPerHr,
} as const;

const last = PRICE_LEVELS[PRICE_LEVELS.length - 1];
if (!last) {
  throw new Error("PRICE_LEVELS is empty");
}

/** Listed prints plus forecast hold. Last print is on the forecast series so the dash chains. */
export const PRICE_CHART = [
  ...PRICE_LEVELS.map((p) => ({
    m: p.m,
    sku5090: p.sku5090,
    pro6000: p.pro6000,
    sku5090Forecast: p.m === last.m ? p.sku5090 : null,
    pro6000Forecast: p.m === last.m ? p.pro6000 : null,
  })),
  {
    m: "Aug 2027",
    sku5090: null,
    pro6000: null,
    sku5090Forecast: last.sku5090,
    pro6000Forecast: last.pro6000,
  },
  {
    m: "Aug 2029",
    sku5090: null,
    pro6000: null,
    sku5090Forecast: last.sku5090,
    pro6000Forecast: last.pro6000,
  },
];
