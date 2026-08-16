import { describe, expect, it } from "vitest";

import { DEFAULT_INPUTS, EXCEL_ELEC_PER_KWH, EXCEL_RENT } from "./defaults";
import { runModel } from "./engine";
import { chartCaption, usdK, usdParenK } from "./format";
import { clampInputs } from "./url";
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

  it("clamps site name to 80 characters", () => {
    const next = clampInputs({ ...DEFAULT_INPUTS, siteName: "x".repeat(200) });
    expect(next.siteName.length).toBe(80);
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
