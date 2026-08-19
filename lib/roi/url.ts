import {
  BOUNDS,
  DEFAULT_GB300_FACILITY,
  DEFAULT_INPUTS,
  DEFAULT_SKU_5090,
  DEFAULT_SKU_GB300,
  DEFAULT_SKU_PRO6000,
} from "./defaults";
import { clamp } from "./finance";
import { cloneBom, syncBomToPrice, bomSum } from "./sources";
import type { Gb300Facility, ModelInputs, SkuId, SkuInputs, TabId } from "./types";
import { TABS } from "./types";
import { parseLocale, type Locale } from "./i18n";

function clampInt(value: number, min: number, max = Number.POSITIVE_INFINITY): number {
  return Math.round(clamp(value, min, max));
}

function clampSku(
  sku: SkuInputs,
  fallbackIt: number,
  rent: { min: number; max: number } = BOUNDS.gpuRentPerHr,
): SkuInputs {
  const bom = (sku.bom ?? []).map((line) => ({
    ...line,
    qty: Math.max(0, line.qty),
    unitPrice: Math.max(0, line.unitPrice),
  }));
  const next: SkuInputs = {
    serverPrice: Math.max(bomSum(bom), sku.serverPrice, 0.01),
    bom,
    gpuRentPerHr: clamp(sku.gpuRentPerHr, rent.min, rent.max),
    utilization: clamp(sku.utilization, BOUNDS.utilization.min, BOUNDS.utilization.max),
    itLoadKw: clamp(sku.itLoadKw, BOUNDS.itLoadKw.min, BOUNDS.itLoadKw.max) || fallbackIt,
    residualPct: clamp(sku.residualPct, BOUNDS.residualPct.min, BOUNDS.residualPct.max),
  };
  if (sku.rackCount != null) {
    next.rackCount = clampInt(sku.rackCount, BOUNDS.rackCount.min, BOUNDS.rackCount.max);
  }
  if (sku.gpusPerServer != null) {
    next.gpusPerServer = clampInt(sku.gpusPerServer, BOUNDS.rackGpus.min, BOUNDS.rackGpus.max);
  }
  if (next.bom.length === 1) {
    next.serverPrice = Math.max(next.serverPrice, 0.01);
    next.bom = syncBomToPrice(next.bom, next.serverPrice);
  } else {
    next.serverPrice = Math.max(bomSum(next.bom), 0.01);
  }
  return next;
}

function clampGb300Sku(sku: SkuInputs): SkuInputs {
  const next = clampSku(sku, DEFAULT_SKU_GB300.itLoadKw, BOUNDS.gb300RentPerHr);
  next.rackCount = clampInt(
    next.rackCount ?? DEFAULT_SKU_GB300.rackCount ?? 24,
    BOUNDS.rackCount.min,
    BOUNDS.rackCount.max,
  );
  next.gpusPerServer = clampInt(
    next.gpusPerServer ?? DEFAULT_SKU_GB300.gpusPerServer ?? 72,
    BOUNDS.rackGpus.min,
    BOUNDS.rackGpus.max,
  );
  return next;
}

function clampFacility(f: Gb300Facility): Gb300Facility {
  return {
    siteName: f.siteName.trim().slice(0, 80),
    elecPerKwh: clamp(f.elecPerKwh, BOUNDS.elecPerKwh.min, BOUNDS.elecPerKwh.max),
    federalTax: clamp(f.federalTax, BOUNDS.federalTax.min, BOUNDS.federalTax.max),
    stateTax: clamp(f.stateTax, BOUNDS.stateTax.min, BOUNDS.stateTax.max),
    propertyTaxPctCapex: clamp(
      f.propertyTaxPctCapex,
      BOUNDS.propertyTaxPctCapex.min,
      BOUNDS.propertyTaxPctCapex.max,
    ),
    obbbaEnabled: Boolean(f.obbbaEnabled),
    pue: clamp(f.pue, BOUNDS.pue.min, BOUNDS.pue.max),
    hoursPerYear: clampInt(f.hoursPerYear, BOUNDS.hoursPerYear.min, BOUNDS.hoursPerYear.max),
    usefulLifeYrs: clampInt(
      f.usefulLifeYrs,
      BOUNDS.gb300UsefulLifeYrs.min,
      BOUNDS.gb300UsefulLifeYrs.max,
    ),
    hallCount: clampInt(f.hallCount, BOUNDS.hallCount.min, BOUNDS.hallCount.max),
    containerCost: Math.max(0, f.containerCost),
    siteConstruction: Math.max(0, f.siteConstruction),
    networkOpexMo: Math.max(0, f.networkOpexMo),
    omOpexMo: Math.max(0, f.omOpexMo),
    insurancePctRev: clamp(f.insurancePctRev, BOUNDS.insurancePctRev.min, BOUNDS.insurancePctRev.max),
    otherOpexPctRev: clamp(
      f.otherOpexPctRev,
      BOUNDS.otherOpexPctRev.min,
      BOUNDS.otherOpexPctRev.max,
    ),
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
    skuGb300: clampGb300Sku(inputs.skuGb300 ?? DEFAULT_SKU_GB300),
    gb300Facility: clampFacility(inputs.gb300Facility ?? DEFAULT_GB300_FACILITY),
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

const G_NUM = {
  g_kwh: "elecPerKwh",
  g_fed: "federalTax",
  g_st: "stateTax",
  g_pt: "propertyTaxPctCapex",
  g_pue: "pue",
  g_hpy: "hoursPerYear",
  g_life: "usefulLifeYrs",
  g_hall: "hallCount",
  g_ccost: "containerCost",
  g_sc: "siteConstruction",
  g_net: "networkOpexMo",
  g_om: "omOpexMo",
  g_ins: "insurancePctRev",
  g_oth: "otherOpexPctRev",
} as const satisfies Record<string, keyof Gb300Facility>;

const SKU_NUM = {
  sp: "serverPrice",
  rent: "gpuRentPerHr",
  util: "utilization",
  it: "itLoadKw",
  res: "residualPct",
} as const satisfies Record<string, Exclude<keyof SkuInputs, "bom" | "rackCount" | "gpusPerServer">>;

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

export { parseLocale };

export function inputsFromSearchParams(params: URLSearchParams): ModelInputs {
  const next: ModelInputs = {
    ...DEFAULT_INPUTS,
    sku5090: { ...DEFAULT_INPUTS.sku5090, bom: cloneBom(DEFAULT_INPUTS.sku5090.bom) },
    skuPro6000: { ...DEFAULT_INPUTS.skuPro6000, bom: cloneBom(DEFAULT_INPUTS.skuPro6000.bom) },
    skuGb300: { ...DEFAULT_INPUTS.skuGb300, bom: cloneBom(DEFAULT_INPUTS.skuGb300.bom) },
    gb300Facility: { ...DEFAULT_GB300_FACILITY },
  };

  const site = params.get("site");
  if (site) next.siteName = site;

  const pe = parseBool(params.get("pe"));
  if (pe != null) next.priceErosionOn = pe;
  const obbba = parseBool(params.get("obbba"));
  if (obbba != null) next.obbbaEnabled = obbba;

  const gSite = params.get("g_site");
  if (gSite) next.gb300Facility.siteName = gSite;
  const gObbba = parseBool(params.get("g_obbba"));
  if (gObbba != null) next.gb300Facility.obbbaEnabled = gObbba;

  for (const [key, field] of Object.entries(NUM)) {
    const n = parseNum(params.get(key));
    if (n != null) (next as unknown as Record<string, unknown>)[field] = n;
  }

  const legacyElec = parseNum(params.get("elec"));
  if (legacyElec != null && legacyElec > 1) {
    next.elecPerKwh = legacyElec / (next.hoursPerYear / 12);
  }

  for (const [key, field] of Object.entries(G_NUM)) {
    const n = parseNum(params.get(key));
    if (n != null) {
      (next.gb300Facility as unknown as Record<string, number>)[field] = n;
    }
  }

  for (const [key, field] of Object.entries(SKU_NUM) as [string, SkuNumField][]) {
    const a = parseNum(params.get(`a_${key}`));
    if (a != null) next.sku5090[field] = a;
    const b = parseNum(params.get(`b_${key}`));
    if (b != null) next.skuPro6000[field] = b;
    const c = parseNum(params.get(`c_${key}`));
    if (c != null) next.skuGb300[field] = c;
  }

  const cRc = parseNum(params.get("c_rc"));
  if (cRc != null) next.skuGb300.rackCount = cRc;
  const cGp = parseNum(params.get("c_gp"));
  if (cGp != null) next.skuGb300.gpusPerServer = cGp;

  // Old GB300 URLs stored $/GPU-hr (Reset $10). Now billed $/server-hr (Reset $720).
  // New writes set c_ru=s. Missing flag + c_rent ≤ 50 still means GPU-hr.
  const cRent = parseNum(params.get("c_rent"));
  const serverHr = params.get("c_ru") === "s";
  if (cRent != null && cRent <= 50 && !serverHr) {
    const gpus = next.skuGb300.gpusPerServer ?? DEFAULT_SKU_GB300.gpusPerServer ?? 72;
    next.skuGb300.gpuRentPerHr = cRent * gpus;
  }

  if (parseNum(params.get("a_sp")) != null) {
    next.sku5090.bom = syncBomToPrice(next.sku5090.bom, next.sku5090.serverPrice);
  }
  if (parseNum(params.get("b_sp")) != null) {
    next.skuPro6000.bom = syncBomToPrice(next.skuPro6000.bom, next.skuPro6000.serverPrice);
  }
  if (parseNum(params.get("c_sp")) != null) {
    next.skuGb300.bom = syncBomToPrice(next.skuGb300.bom, next.skuGb300.serverPrice);
  }

  return clampInputs(next);
}

function close(a: number, b: number) {
  return Math.abs(a - b) < 1e-9;
}

export function searchParamsFromState(
  tab: TabId,
  inputs: ModelInputs,
  locale: Locale = "en",
): URLSearchParams {
  const d = DEFAULT_INPUTS;
  const params = new URLSearchParams();
  if (tab !== "5090") params.set("tab", tab);
  if (locale !== "en") params.set("lang", locale);
  const site = inputs.siteName.trim();
  if (site && site !== d.siteName) params.set("site", site);
  if (inputs.priceErosionOn !== d.priceErosionOn) params.set("pe", inputs.priceErosionOn ? "1" : "0");
  if (inputs.obbbaEnabled !== d.obbbaEnabled) params.set("obbba", inputs.obbbaEnabled ? "1" : "0");

  const gSite = inputs.gb300Facility.siteName.trim();
  if (gSite && gSite !== d.gb300Facility.siteName) params.set("g_site", gSite);
  if (inputs.gb300Facility.obbbaEnabled !== d.gb300Facility.obbbaEnabled) {
    params.set("g_obbba", inputs.gb300Facility.obbbaEnabled ? "1" : "0");
  }
  for (const [key, field] of Object.entries(G_NUM)) {
    const value = inputs.gb300Facility[field];
    const def = d.gb300Facility[field];
    if (typeof value === "number" && typeof def === "number" && !close(value, def)) {
      params.set(key, String(value));
    }
  }

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
    if (!close(inputs.skuGb300[field], d.skuGb300[field])) {
      params.set(`c_${key}`, String(inputs.skuGb300[field]));
      if (field === "gpuRentPerHr") params.set("c_ru", "s");
    }
  }

  const rc = inputs.skuGb300.rackCount;
  const rcDef = d.skuGb300.rackCount ?? 24;
  if (rc != null && !close(rc, rcDef)) params.set("c_rc", String(rc));
  const gp = inputs.skuGb300.gpusPerServer;
  const gpDef = d.skuGb300.gpusPerServer ?? 72;
  if (gp != null && !close(gp, gpDef)) params.set("c_gp", String(gp));

  return params;
}
