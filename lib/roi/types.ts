export const SKU_IDS = ["5090", "pro6000"] as const;
export type SkuId = (typeof SKU_IDS)[number];

export const TABS = ["5090", "pro6000", "compare", "research"] as const;
export type TabId = (typeof TABS)[number];

export type BomLine = {
  key: string;
  item: string;
  qty: number;
  unitPrice: number;
};

export type SkuInputs = {
  serverPrice: number;
  bom: BomLine[];
  gpuRentPerHr: number;
  utilization: number;
  itLoadKw: number;
  residualPct: number;
};

export type SharedInputs = {
  siteName: string;
  elecPerKwh: number;
  discountRate: number;
  priceErosionOn: boolean;
  priceErosionRate: number;
  federalTax: number;
  stateTax: number;
  propertyTaxPctCapex: number;
  obbbaEnabled: boolean;
  containerCount: number;
  serversPerContainer: number;
  gpusPerServer: number;
  pue: number;
  hoursPerYear: number;
  containerCost: number;
  siteConstruction: number;
  networkOpexMo: number;
  omOpexMo: number;
  insurancePctRev: number;
  otherOpexPctRev: number;
  usefulLifeYrs: number;
};

export type ModelInputs = SharedInputs & {
  sku5090: SkuInputs;
  skuPro6000: SkuInputs;
};

export type YearRow = {
  year: number;
  revenue: number;
  electricity: number;
  network: number;
  om: number;
  insurance: number;
  propertyTax: number;
  otherOpex: number;
  totalOpex: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  taxableIncome: number;
  tax: number;
  nolRemaining: number;
  ncf: number;
  residualCash: number;
  cashFlow: number;
  cumulative: number;
};

export type SkuResult = {
  skuId: SkuId;
  skuLabel: string;
  combinedTax: number;
  totalServers: number;
  totalGpus: number;
  infraCapex: number;
  serverCapex: number;
  totalCapex: number;
  itLoadTotalKw: number;
  totalPowerKw: number;
  effectiveKwh: number;
  depreciableBasis: number;
  residualCash: number;
  slDep: number;
  years: YearRow[];
  cashFlows: number[];
  y1Ncf: number;
  paybackYears: number | null;
  breakevenMonth: number | null;
  irr: number | null;
  npv: number;
  cashOnCash: number;
  totalRoi: number;
  moic: number;
  revenuePerGpu: number;
  opexPerGpu: number;
  ncfPerGpu: number;
  capexPerGpu: number;
  revenuePerKw: number;
  ncfPerKw: number;
};

export type ModelResult = {
  sku5090: SkuResult;
  skuPro6000: SkuResult;
};
