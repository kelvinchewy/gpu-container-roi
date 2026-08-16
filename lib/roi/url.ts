import { BOUNDS, DEFAULT_INPUTS, DEFAULT_SKU_5090, DEFAULT_SKU_PRO6000 } from "./defaults";
import { clamp } from "./finance";
import { cloneBom, syncBomToPrice, bomSum } from "./sources";
import type { ModelInputs, SkuInputs, TabId } from "./types";
import { TABS } from "./types";

function clampInt(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max));
}

function clampSku(sku: SkuInputs, fallbackIt: number): SkuInputs {
  const bom = (sku.bom ?? []).map((line) => ({
    ...line,
    qty: Math.max(0, line.qty),
    unitPrice: Math.max(0, line.unitPrice),
  }));
  return {
    serverPrice: Math.max(bomSum(bom), 0.01),
    bom,
    gpuRentPerHr: clamp(sku.gpuRentPerHr, BOUNDS.gpuRentPerHr.min, BOUNDS.gpuRentPerHr.max),
    utilization: clamp(sku.utilization, BOUNDS.utilization.min, BOUNDS.utilization.max),
    itLoadKw: clamp(sku.itLoadKw, BOUNDS.itLoadKw.min, BOUNDS.itLoadKw.max) || fallbackIt,
    residualPct: clamp(sku.residualPct, BOUNDS.residualPct.min, BOUNDS.residualPct.max),
  };
}

export function clampInputs(inputs: ModelInputs): ModelInputs {
  return {
    ...inputs,
    siteName: inputs.siteName.trim().slice(0, 80),
    elecPerKwh: clamp(inputs.elecPerKwh, BOUNDS.elecPerKwh.min, BOUNDS.elecPerKwh.max),
    discountRate: clamp(inputs.discountRate, BOUNDS.discountRate.min, BOUNDS.discountRate.max),
    priceErosionRate: clamp(
      inputs.priceErosionRate,
      BOUNDS.priceErosionRate.min,
      BOUNDS.priceErosionRate.max,
    ),
    federalTax: clamp(inputs.federalTax, BOUNDS.federalTax.min, BOUNDS.federalTax.max),
    stateTax: clamp(inputs.stateTax, BOUNDS.stateTax.min, BOUNDS.stateTax.max),
    propertyTaxPctCapex: clamp(
      inputs.propertyTaxPctCapex,
      BOUNDS.propertyTaxPctCapex.min,
      BOUNDS.propertyTaxPctCapex.max,
    ),
    containerCount: clampInt(
      inputs.containerCount,
      BOUNDS.containerCount.min,
      BOUNDS.containerCount.max,
    ),
    serversPerContainer: clampInt(
      inputs.serversPerContainer,
      BOUNDS.serversPerContainer.min,
      BOUNDS.serversPerContainer.max,
    ),
    gpusPerServer: clampInt(
      inputs.gpusPerServer,
      BOUNDS.gpusPerServer.min,
      BOUNDS.gpusPerServer.max,
    ),
    pue: clamp(inputs.pue, BOUNDS.pue.min, BOUNDS.pue.max),
    hoursPerYear: clampInt(inputs.hoursPerYear, BOUNDS.hoursPerYear.min, BOUNDS.hoursPerYear.max),
    containerCost: Math.max(0, inputs.containerCost),
    siteConstruction: Math.max(0, inputs.siteConstruction),
    networkOpexMo: Math.max(0, inputs.networkOpexMo),
    omOpexMo: Math.max(0, inputs.omOpexMo),
    insurancePctRev: clamp(
      inputs.insurancePctRev,
      BOUNDS.insurancePctRev.min,
      BOUNDS.insurancePctRev.max,
    ),
    otherOpexPctRev: clamp(
      inputs.otherOpexPctRev,
      BOUNDS.otherOpexPctRev.min,
      BOUNDS.otherOpexPctRev.max,
    ),
    usefulLifeYrs: clampInt(
      inputs.usefulLifeYrs,
      BOUNDS.usefulLifeYrs.min,
      BOUNDS.usefulLifeYrs.max,
    ),
    sku5090: clampSku(inputs.sku5090, DEFAULT_SKU_5090.itLoadKw),
    skuPro6000: clampSku(inputs.skuPro6000, DEFAULT_SKU_PRO6000.itLoadKw),
  };
}

const NUM = {
  kwh: "elecPerKwh",
  dr: "discountRate",
  per: "priceErosionRate",
  fed: "federalTax",
  st: "stateTax",
  pt: "propertyTaxPctCapex",
  cc: "containerCount",
  spc: "serversPerContainer",
  gps: "gpusPerServer",
  pue: "pue",
  hpy: "hoursPerYear",
  ccost: "containerCost",
  sc: "siteConstruction",
  net: "networkOpexMo",
  om: "omOpexMo",
  ins: "insurancePctRev",
  oth: "otherOpexPctRev",
  life: "usefulLifeYrs",
} as const satisfies Record<string, keyof ModelInputs>;

const SKU_NUM = {
  sp: "serverPrice",
  rent: "gpuRentPerHr",
  util: "utilization",
  it: "itLoadKw",
  res: "residualPct",
} as const satisfies Record<string, Exclude<keyof SkuInputs, "bom">>;

type SkuNumField = (typeof SKU_NUM)[keyof typeof SKU_NUM];

function parseNum(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function parseBool(raw: string | null): boolean | undefined {
  if (raw == null) return undefined;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return undefined;
}

export function parseTab(raw: string | null): TabId {
  if (raw && (TABS as readonly string[]).includes(raw)) return raw as TabId;
  return "5090";
}

export function inputsFromSearchParams(params: URLSearchParams): ModelInputs {
  const next: ModelInputs = {
    ...DEFAULT_INPUTS,
    sku5090: { ...DEFAULT_INPUTS.sku5090, bom: cloneBom(DEFAULT_INPUTS.sku5090.bom) },
    skuPro6000: { ...DEFAULT_INPUTS.skuPro6000, bom: cloneBom(DEFAULT_INPUTS.skuPro6000.bom) },
  };

  const site = params.get("site");
  if (site) next.siteName = site;

  const pe = parseBool(params.get("pe"));
  if (pe != null) next.priceErosionOn = pe;
  const obbba = parseBool(params.get("obbba"));
  if (obbba != null) next.obbbaEnabled = obbba;

  for (const [key, field] of Object.entries(NUM)) {
    const n = parseNum(params.get(key));
    if (n != null) (next as unknown as Record<string, unknown>)[field] = n;
  }

  const legacyElec = parseNum(params.get("elec"));
  if (legacyElec != null && legacyElec > 1) {
    next.elecPerKwh = legacyElec / (next.hoursPerYear / 12);
  }

  for (const [key, field] of Object.entries(SKU_NUM) as [string, SkuNumField][]) {
    const a = parseNum(params.get(`a_${key}`));
    if (a != null) next.sku5090[field] = a;
    const b = parseNum(params.get(`b_${key}`));
    if (b != null) next.skuPro6000[field] = b;
  }

  if (parseNum(params.get("a_sp")) != null) {
    next.sku5090.bom = syncBomToPrice(next.sku5090.bom, next.sku5090.serverPrice);
  }
  if (parseNum(params.get("b_sp")) != null) {
    next.skuPro6000.bom = syncBomToPrice(next.skuPro6000.bom, next.skuPro6000.serverPrice);
  }

  return clampInputs(next);
}

function close(a: number, b: number) {
  return Math.abs(a - b) < 1e-9;
}

export function searchParamsFromState(tab: TabId, inputs: ModelInputs): URLSearchParams {
  const d = DEFAULT_INPUTS;
  const params = new URLSearchParams();
  if (tab !== "5090") params.set("tab", tab);
  const site = inputs.siteName.trim();
  if (site && site !== d.siteName) params.set("site", site);
  if (inputs.priceErosionOn !== d.priceErosionOn) params.set("pe", inputs.priceErosionOn ? "1" : "0");
  if (inputs.obbbaEnabled !== d.obbbaEnabled) params.set("obbba", inputs.obbbaEnabled ? "1" : "0");

  for (const [key, field] of Object.entries(NUM)) {
    const value = inputs[field];
    const def = d[field];
    if (typeof value === "number" && typeof def === "number" && !close(value, def)) {
      params.set(key, String(value));
    }
  }

  for (const [key, field] of Object.entries(SKU_NUM) as [string, SkuNumField][]) {
    if (!close(inputs.sku5090[field], d.sku5090[field])) {
      params.set(`a_${key}`, String(inputs.sku5090[field]));
    }
    if (!close(inputs.skuPro6000[field], d.skuPro6000[field])) {
      params.set(`b_${key}`, String(inputs.skuPro6000[field]));
    }
  }

  return params;
}
