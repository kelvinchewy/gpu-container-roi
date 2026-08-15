import type { ModelInputs, SkuInputs } from "./types";
import { DEFAULT_BOM, bomSum, cloneBom } from "./sources";

export const SKU_LABEL = {
  "5090": "RTX 5090",
  pro6000: "Pro 6000",
} as const;

export const DEFAULT_SKU_5090: SkuInputs = {
  serverPrice: bomSum(DEFAULT_BOM["5090"]),
  bom: DEFAULT_BOM["5090"].map((line) => ({ ...line })),
  gpuRentPerHr: 0.63,
  utilization: 1,
  itLoadKw: 6.8,
  residualPct: 0.1,
};

export const DEFAULT_SKU_PRO6000: SkuInputs = {
  serverPrice: bomSum(DEFAULT_BOM.pro6000),
  bom: DEFAULT_BOM.pro6000.map((line) => ({ ...line })),
  gpuRentPerHr: 1.73,
  utilization: 1,
  itLoadKw: 6.3,
  residualPct: 0.1,
};

export const DEFAULT_INPUTS: ModelInputs = {
  siteName: "Atlanta, GA",
  elecPerKwh: 0.06,
  discountRate: 0.1,
  priceErosionOn: false,
  priceErosionRate: 0.1,
  federalTax: 0.21,
  stateTax: 0.0575,
  propertyTaxPctCapex: 0.01,
  obbbaEnabled: true,
  containerCount: 1,
  serversPerContainer: 35,
  gpusPerServer: 8,
  pue: 1.3,
  hoursPerYear: 8760,
  containerCost: 400_000,
  siteConstruction: 200_000,
  networkOpexMo: 3750,
  omOpexMo: 2500,
  insurancePctRev: 0.03,
  otherOpexPctRev: 0.01,
  usefulLifeYrs: 5,
  sku5090: { ...DEFAULT_SKU_5090, bom: cloneBom(DEFAULT_SKU_5090.bom) },
  skuPro6000: { ...DEFAULT_SKU_PRO6000, bom: cloneBom(DEFAULT_SKU_PRO6000.bom) },
};

export const BOUNDS = {
  elecPerKwh: { min: 0.02, max: 0.25 },
  discountRate: { min: 0.05, max: 0.2 },
  priceErosionRate: { min: 0, max: 0.25 },
  gpuRentPerHr: { min: 0.01, max: 10 },
  utilization: { min: 0.4, max: 1 },
  federalTax: { min: 0, max: 0.35 },
  stateTax: { min: 0, max: 0.15 },
  propertyTaxPctCapex: { min: 0, max: 0.05 },
  containerCount: { min: 1, max: 20 },
  serversPerContainer: { min: 1, max: 64 },
  gpusPerServer: { min: 1, max: 8 },
  itLoadKw: { min: 0.5, max: 20 },
  pue: { min: 1.05, max: 1.6 },
  hoursPerYear: { min: 8000, max: 8784 },
  insurancePctRev: { min: 0, max: 0.1 },
  otherOpexPctRev: { min: 0, max: 0.1 },
  residualPct: { min: 0, max: 0.3 },
  usefulLifeYrs: { min: 3, max: 7 },
} as const;

export const EXCEL_ELEC_PER_KWH = 60 / (8760 / 12);
export const EXCEL_RENT = {
  "5090": 0.63,
  pro6000: 1.94,
} as const;
export const MATRIX_UTILS = [0.6, 0.7, 0.8, 0.9, 1] as const;
export const MATRIX_DECAY = [0, 0.05, 0.1, 0.15, 0.2, 0.25] as const;
