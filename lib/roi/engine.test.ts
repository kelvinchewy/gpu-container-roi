import { describe, expect, it } from "vitest";

import { DEFAULT_INPUTS, EXCEL_ELEC_PER_KWH, EXCEL_RENT } from "./defaults";
import { runModel } from "./engine";
import { chartCaption, usdK, usdParenK, years } from "./format";
import { parseLocale } from "./i18n";
import { breakevenMatrix, clearMatrixCache } from "./matrix";
import { clampInputs, inputsFromSearchParams, parseTab, searchParamsFromState } from "./url";
import type { ModelInputs } from "./types";

function run(overrides: Partial<ModelInputs> = {}) {
  return runModel({
    ...DEFAULT_INPUTS,
    elecPerKwh: EXCEL_ELEC_PER_KWH,
    ...overrides,
    sku5090: {
      ...DEFAULT_INPUTS.sku5090,
      gpuRentPerHr: EXCEL_RENT["5090"],
      ...overrides.sku5090,
    },
    skuPro6000: {
      ...DEFAULT_INPUTS.skuPro6000,
      gpuRentPerHr: EXCEL_RENT.pro6000,
      ...overrides.skuPro6000,
    },
  });
}

describe("display format", () => {
  it("rounds chart money to nearest k", () => {
    expect(usdK(3_687_000)).toBe("$3,687k");
    expect(usdK(1_148_815)).toBe("$1,149k");
    expect(usdK(344_342)).toBe("$344k");
    expect(usdK(-3_687_000)).toBe("-$3,687k");
    expect(usdK(0)).toBe("$0k");
    expect(usdParenK(-3_687_000)).toBe("($3,687k)");
    expect(usdParenK(1_148_815)).toBe("$1,149k");
    expect(usdParenK(0)).toBe("$0k");
  });

  it("caption includes site, tax, topology, PUE, OBBBA, decay", () => {
    const caption = chartCaption(DEFAULT_INPUTS, "RTX 5090");
    expect(caption).toContain("RTX 5090");
    expect(caption).toContain("Atlanta, GA");
    expect(caption).toContain("tax 25.5%");
    expect(caption).toContain("1×35 servers");
    expect(caption).toContain("PUE 1.30");
    expect(caption).toContain("OBBBA on");
    expect(caption).toContain("decay off");
  });

  it("years and captions translate when locale is zh", () => {
    expect(years(3.48, 2, "zh")).toContain("年");
    const caption = chartCaption(DEFAULT_INPUTS, "RTX 5090", undefined, "zh");
    expect(caption).toContain("OBBBA 开");
    expect(caption).toContain("衰减关");
    expect(caption).toContain("税 25.5%");
  });

  it("round-trips lang=zh and defaults to en", () => {
    expect(parseLocale("zh")).toBe("zh");
    expect(parseLocale("zh-CN")).toBe("zh");
    expect(parseLocale(null)).toBe("en");
    expect(searchParamsFromState("5090", DEFAULT_INPUTS).get("lang")).toBeNull();
    expect(searchParamsFromState("5090", DEFAULT_INPUTS, "zh").get("lang")).toBe("zh");
  });

  it("drops legacy research and context tabs", () => {
    expect(parseTab("research")).toBe("5090");
    expect(parseTab("context")).toBe("5090");
    expect(parseTab("compare")).toBe("compare");
    expect(parseTab("gb300")).toBe("gb300");
  });

  it("clamps site name to 80 characters", () => {
    const next = clampInputs({ ...DEFAULT_INPUTS, siteName: "x".repeat(200) });
    expect(next.siteName.length).toBe(80);
  });

  it("useful life caps at 5 for 5090 / Pro 6000 and 10 for GB300", () => {
    const air = clampInputs({ ...DEFAULT_INPUTS, usefulLifeYrs: 10 });
    expect(air.usefulLifeYrs).toBe(5);
    const gb = clampInputs({
      ...DEFAULT_INPUTS,
      gb300Facility: { ...DEFAULT_INPUTS.gb300Facility, usefulLifeYrs: 15 },
    });
    expect(gb.gb300Facility.usefulLifeYrs).toBe(10);
    expect(gb.usefulLifeYrs).toBe(5);

    const { sku5090, skuGb300 } = runModel({
      ...DEFAULT_INPUTS,
      usefulLifeYrs: 5,
      gb300Facility: { ...DEFAULT_INPUTS.gb300Facility, usefulLifeYrs: 10 },
    });
    expect(sku5090.years).toHaveLength(5);
    expect(skuGb300.years).toHaveLength(10);
  });

  it("clamps 5090 rent at $50 and GB300 rent at $5000", () => {
    const air = clampInputs({
      ...DEFAULT_INPUTS,
      sku5090: { ...DEFAULT_INPUTS.sku5090, gpuRentPerHr: 720 },
    });
    expect(air.sku5090.gpuRentPerHr).toBe(50);
    const gb = clampInputs({
      ...DEFAULT_INPUTS,
      skuGb300: { ...DEFAULT_INPUTS.skuGb300, gpuRentPerHr: 9_999 },
    });
    expect(gb.skuGb300.gpuRentPerHr).toBe(5_000);
  });

  it("migrates legacy GB300 c_rent $/GPU-hr to $/server-hr", () => {
    const legacy = inputsFromSearchParams(new URLSearchParams("c_rent=10"));
    expect(legacy.skuGb300.gpuRentPerHr).toBe(720);
    const already = inputsFromSearchParams(new URLSearchParams("c_rent=800"));
    expect(already.skuGb300.gpuRentPerHr).toBe(800);
    const marked = inputsFromSearchParams(new URLSearchParams("c_rent=50&c_ru=s"));
    expect(marked.skuGb300.gpuRentPerHr).toBe(50);
    const out = searchParamsFromState("gb300", {
      ...DEFAULT_INPUTS,
      skuGb300: { ...DEFAULT_INPUTS.skuGb300, gpuRentPerHr: 50 },
    });
    expect(out.get("c_rent")).toBe("50");
    expect(out.get("c_ru")).toBe("s");
  });

  it("does not crash if gb300Facility is missing", () => {
    const broken = { ...DEFAULT_INPUTS } as ModelInputs;
    delete (broken as { gb300Facility?: unknown }).gb300Facility;
    expect(() => runModel(broken)).not.toThrow();
    expect(runModel(broken).skuGb300.totalGpus).toBe(1_728);
  });
});

describe("ScenA golden values", () => {
  it("default server price equals BOM sum", () => {
    expect(DEFAULT_INPUTS.sku5090.serverPrice).toBe(88_200);
    expect(DEFAULT_INPUTS.skuPro6000.serverPrice).toBe(191_800);
    expect(DEFAULT_INPUTS.sku5090.gpuRentPerHr).toBe(0.63);
    expect(DEFAULT_INPUTS.skuPro6000.gpuRentPerHr).toBe(1.73);
  });

  it("OBBBA on matches Excel with-residual series", () => {
    const { sku5090, skuPro6000 } = run();

    expect(sku5090.totalCapex).toBe(3_687_000);
    expect(skuPro6000.totalCapex).toBe(7_313_000);

    expect(sku5090.irr).toBeCloseTo(0.1366, 4);
    expect(skuPro6000.irr).toBeCloseTo(0.4173, 4);

    expect(sku5090.npv).toBeCloseTo(344_342, 0);
    expect(skuPro6000.npv).toBeCloseTo(6_361_070, 0);

    expect(sku5090.paybackYears).toBeCloseTo(3.48, 2);
    expect(skuPro6000.paybackYears).toBeCloseTo(1.86, 2);

    expect(sku5090.cashFlows[1]).toBeCloseTo(1_148_815.44, 1);
    expect(sku5090.cashFlows[5]).toBeCloseTo(1_164_079.26, 1);
    expect(skuPro6000.cashFlows[1]).toBeCloseTo(4_213_576.72, 1);
    expect(skuPro6000.residualCash).toBe(671_300);
  });

  it("OBBBA off matches Excel straight-line + residual", () => {
    const { sku5090, skuPro6000 } = run({ obbbaEnabled: false });

    expect(sku5090.y1Ncf).toBeCloseTo(997_309, 0);
    expect(skuPro6000.y1Ncf).toBeCloseTo(3_445_964, 0);

    expect(sku5090.irr).toBeCloseTo(0.1287, 4);
    expect(skuPro6000.irr).toBeCloseTo(0.386, 4);

    expect(sku5090.npv).toBeCloseTo(285_263, 0);
    expect(skuPro6000.npv).toBeCloseTo(6_166_740, 0);

    expect(sku5090.paybackYears).toBeCloseTo(3.7, 2);
    expect(skuPro6000.paybackYears).toBeCloseTo(2.12, 2);

    expect(sku5090.residualCash).toBe(308_700);
    expect(skuPro6000.residualCash).toBe(671_300);

    expect(sku5090.cashOnCash).toBeCloseTo(997_309 / 3_687_000, 4);
    expect(sku5090.moic).toBeCloseTo((997_309 * 5 + 308_700) / 3_687_000, 4);
    expect(sku5090.totalRoi).toBeCloseTo(sku5090.moic - 1, 6);
    expect(sku5090.capexPerGpu).toBeCloseTo(3_687_000 / 280, 4);
  });
});

describe("GB300 NVL72", () => {
  it("is 24 racks × 72 GPUs and does not change 5090 / Pro 6000 topology", () => {
    const { sku5090, skuPro6000, skuGb300 } = runModel();

    expect(sku5090.totalGpus).toBe(280);
    expect(skuPro6000.totalGpus).toBe(280);

    expect(skuGb300.totalServers).toBe(24);
    expect(skuGb300.totalGpus).toBe(1_728);
    expect(skuGb300.serverCapex).toBe(120_000_000);
    expect(skuGb300.infraCapex).toBe(58_000_000);
    expect(skuGb300.totalCapex).toBe(178_000_000);
    expect(skuGb300.itLoadTotalKw).toBe(3_360);
    expect(skuGb300.residualCash).toBe(12_000_000);
    expect(DEFAULT_INPUTS.gb300Facility.containerCost).toBe(0);
    expect(DEFAULT_INPUTS.gb300Facility.siteConstruction).toBe(58_000_000);
    expect(skuGb300.irr).not.toBeNull();
    expect(Number.isFinite(skuGb300.npv)).toBe(true);
    expect(skuGb300.cashFlows[1]).toBeGreaterThan(0);
    expect(skuGb300.years[0]?.revenue).toBe(24 * 720 * 8760);
  });

  it("bills GB300 rent per rack, not per GPU", () => {
    const base = runModel();
    const fewerGpus = runModel({
      ...DEFAULT_INPUTS,
      skuGb300: { ...DEFAULT_INPUTS.skuGb300, gpusPerServer: 36 },
    });
    expect(fewerGpus.skuGb300.years[0]?.revenue).toBe(base.skuGb300.years[0]?.revenue);
    expect(fewerGpus.skuGb300.totalGpus).toBe(864);
  });

  it("caption is NVL72 racks, not 35×8, and uses GB300 facility", () => {
    const caption = chartCaption(DEFAULT_INPUTS, "GB300", "gb300");
    expect(caption).toContain("NVL72");
    expect(caption).toContain("Blackwell Ultra");
    expect(caption).toContain("24 racks");
    expect(caption).toContain("1 hall");
    expect(caption).not.toContain("1×35 servers");
  });

  it("does not fall back to 35×8 if rack fields are omitted", () => {
    const { skuGb300 } = runModel({
      ...DEFAULT_INPUTS,
      skuGb300: {
        ...DEFAULT_INPUTS.skuGb300,
        rackCount: undefined,
        gpusPerServer: undefined,
      },
    });
    expect(skuGb300.totalServers).toBe(24);
    expect(skuGb300.totalGpus).toBe(1_728);
  });

  it("does not share site, tax, topology, or power with 5090 / Pro 6000", () => {
    const base = runModel();
    const air = runModel({
      ...DEFAULT_INPUTS,
      federalTax: 0.35,
      elecPerKwh: 0.2,
      containerCount: 5,
      pue: 1.5,
      obbbaEnabled: false,
    });
    expect(air.sku5090.combinedTax).not.toBeCloseTo(base.sku5090.combinedTax, 6);
    expect(air.sku5090.totalGpus).toBe(1_400);
    expect(air.skuGb300.combinedTax).toBeCloseTo(base.skuGb300.combinedTax, 6);
    expect(air.skuGb300.totalGpus).toBe(1_728);
    expect(air.skuGb300.totalCapex).toBe(178_000_000);
    expect(air.skuGb300.effectiveKwh).toBeCloseTo(base.skuGb300.effectiveKwh, 6);

    const hallInputs = {
      ...DEFAULT_INPUTS,
      gb300Facility: {
        ...DEFAULT_INPUTS.gb300Facility,
        federalTax: 0.35,
        elecPerKwh: 0.2,
        hallCount: 2,
        pue: 1.5,
        obbbaEnabled: false,
        siteName: "Dallas, TX",
      },
    };
    const hall = runModel(hallInputs);
    expect(hall.sku5090.combinedTax).toBeCloseTo(base.sku5090.combinedTax, 6);
    expect(hall.sku5090.totalCapex).toBe(3_687_000);
    expect(hall.sku5090.effectiveKwh).toBeCloseTo(base.sku5090.effectiveKwh, 6);
    expect(hall.skuGb300.combinedTax).not.toBeCloseTo(base.skuGb300.combinedTax, 6);
    expect(hall.skuGb300.infraCapex).toBe(116_000_000);
    expect(hall.skuGb300.totalGpus).toBe(1_728);
    expect(chartCaption(hallInputs, "GB300", "gb300")).toContain("Dallas, TX");
    expect(chartCaption(hallInputs, "RTX 5090")).toContain("Atlanta, GA");
  });
});

describe("breakeven matrix cache", () => {
  it("reuses the grid when only utilization or decay changes", () => {
    clearMatrixCache();
    const a = breakevenMatrix(DEFAULT_INPUTS, "5090");
    const b = breakevenMatrix(
      {
        ...DEFAULT_INPUTS,
        priceErosionOn: true,
        priceErosionRate: 0.1,
        sku5090: { ...DEFAULT_INPUTS.sku5090, utilization: 0.8 },
      },
      "5090",
    );
    expect(b).toBe(a);
    expect(a[0]?.[4]).not.toBeNull();
  });
});
