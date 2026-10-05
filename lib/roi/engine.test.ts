import { describe, expect, it } from "vitest";

import {
  DEFAULT_INPUTS,
  EXCEL_ELEC_PER_KWH,
  EXCEL_RENT,
  GB300_GPUS_PER_RACK,
  gb300SiteConstruction,
  snapGb300Racks,
  withGb300RackCount,
} from "./defaults";
import { runModel } from "./engine";
import { chartCaption, usdK, usdParenK, years } from "./format";
import { parseLocale } from "./i18n";
import { breakevenMatrix, clearMatrixCache } from "./matrix";
import { clampInputs, inputsFromSearchParams, parseTab, searchParamsFromState } from "./url";
import type { Gb300Phase, ModelInputs } from "./types";
import { addMonths, phaseCapex, yearMonthIndex } from "./phases";

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
    expect(skuGb300.infraCapex).toBe(48_000_000);
    expect(skuGb300.totalCapex).toBe(168_000_000);
    expect(skuGb300.itLoadTotalKw).toBe(3_360);
    expect(skuGb300.residualCash).toBe(12_000_000);
    expect(DEFAULT_INPUTS.gb300Facility.containerCost).toBe(0);
    expect(DEFAULT_INPUTS.gb300Facility.siteConstruction).toBe(48_000_000);
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
    expect(air.skuGb300.totalCapex).toBe(168_000_000);
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
    expect(hall.skuGb300.infraCapex).toBe(96_000_000);
    expect(hall.skuGb300.totalGpus).toBe(1_728);
    expect(chartCaption(hallInputs, "GB300", "gb300")).toContain("Dallas, TX");
    expect(chartCaption(hallInputs, "RTX 5090")).toContain("Atlanta, GA");
  });

  it("scales site construction $12M per 6 racks and locks NVL72 at 72 GPUs", () => {
    expect(snapGb300Racks(7)).toBe(6);
    expect(snapGb300Racks(10)).toBe(12);
    expect(snapGb300Racks(1)).toBe(6);
    expect(snapGb300Racks(64)).toBe(60);
    expect(gb300SiteConstruction(6)).toBe(12_000_000);
    expect(gb300SiteConstruction(12)).toBe(24_000_000);
    expect(gb300SiteConstruction(24)).toBe(48_000_000);
    expect(gb300SiteConstruction(36)).toBe(72_000_000);

    const twelve = withGb300RackCount(DEFAULT_INPUTS, 12);
    expect(twelve.skuGb300.rackCount).toBe(12);
    expect(twelve.skuGb300.gpusPerServer).toBe(GB300_GPUS_PER_RACK);
    expect(twelve.gb300Facility.siteConstruction).toBe(24_000_000);
    expect(runModel(twelve).skuGb300.infraCapex).toBe(24_000_000);
    expect(runModel(twelve).skuGb300.totalGpus).toBe(12 * 72);

    const locked = clampInputs({
      ...DEFAULT_INPUTS,
      skuGb300: { ...DEFAULT_INPUTS.skuGb300, gpusPerServer: 36, rackCount: 10 },
    });
    expect(locked.skuGb300.gpusPerServer).toBe(72);
    expect(locked.skuGb300.rackCount).toBe(12);

    const fromRacks = inputsFromSearchParams(new URLSearchParams("c_rc=18"));
    expect(fromRacks.skuGb300.rackCount).toBe(18);
    expect(fromRacks.gb300Facility.siteConstruction).toBe(36_000_000);
    expect(fromRacks.skuGb300.gpusPerServer).toBe(72);

    const override = inputsFromSearchParams(new URLSearchParams("c_rc=18&g_sc=50000000"));
    expect(override.gb300Facility.siteConstruction).toBe(50_000_000);

    const gpIgnored = inputsFromSearchParams(new URLSearchParams("c_gp=36"));
    expect(gpIgnored.skuGb300.gpusPerServer).toBe(72);
    expect(searchParamsFromState("gb300", locked).get("c_gp")).toBeNull();
  });

  it("staggers GB300 cashflow when CODs differ and keeps the yearly path when they match", () => {
    const splitSame = runModel({
      ...DEFAULT_INPUTS,
      skuGb300: {
        ...DEFAULT_INPUTS.skuGb300,
        rackCount: 24,
        phases: [
          { id: "p1", goLive: "2026-03", rackCount: 12 },
          { id: "p2", goLive: "2026-03", rackCount: 12 },
        ],
      },
    });
    expect(splitSame.skuGb300.axis ?? "model").toBe("model");
    expect(splitSame.skuGb300.totalCapex).toBe(168_000_000);
    expect(splitSame.skuGb300.years[0]?.revenue).toBe(24 * 720 * 8760);

    const staggered = runModel({
      ...DEFAULT_INPUTS,
      skuGb300: {
        ...DEFAULT_INPUTS.skuGb300,
        rackCount: 24,
        phases: [
          { id: "p1", goLive: "2026-03", rackCount: 12 },
          { id: "p2", goLive: "2026-12", rackCount: 12 },
        ],
      },
    });
    expect(staggered.skuGb300.axis).toBe("calendar");
    expect(staggered.skuGb300.totalServers).toBe(24);
    expect(staggered.skuGb300.totalCapex).toBe(168_000_000);
    expect(staggered.skuGb300.years[0]?.year).toBe(2026);
    expect(staggered.skuGb300.years[0]?.revenue).toBeLessThan(24 * 720 * 8760);
    expect(staggered.skuGb300.years[0]?.cashFlow).toBeLessThan(0);
    expect(staggered.skuGb300.breakevenMonth).not.toBeNull();
    expect(staggered.skuGb300.irr).not.toBeNull();

    const fromUrl = inputsFromSearchParams(new URLSearchParams("c_ph=2026-03:12,2026-12:12"));
    expect(fromUrl.skuGb300.phases).toHaveLength(2);
    expect(fromUrl.skuGb300.rackCount).toBe(24);
    expect(searchParamsFromState("gb300", fromUrl).get("c_ph")).toBe("2026-03:12,2026-12:12");
  });

  it("matches month-count identities for 2–3 phases at 3-month and 12-month lags", () => {
    const life = DEFAULT_INPUTS.gb300Facility.usefulLifeYrs;
    const rent = DEFAULT_INPUTS.skuGb300.gpuRentPerHr;
    const hours = DEFAULT_INPUTS.gb300Facility.hoursPerYear;
    const util = DEFAULT_INPUTS.skuGb300.utilization;
    const it = DEFAULT_INPUTS.skuGb300.itLoadKw;
    const pue = DEFAULT_INPUTS.gb300Facility.pue;
    const kwh = DEFAULT_INPUTS.gb300Facility.elecPerKwh;
    const price = DEFAULT_INPUTS.skuGb300.serverPrice;
    const residualPct = DEFAULT_INPUTS.skuGb300.residualPct;
    const hall = DEFAULT_INPUTS.gb300Facility.hallCount;
    const container = DEFAULT_INPUTS.gb300Facility.containerCost;

    function annualRevenue(racks: number) {
      return racks * rent * hours * util;
    }
    function annualElec(racks: number) {
      return racks * it * pue * kwh * hours;
    }
    function monthsLive(goLive: string, year: number) {
      const start = yearMonthIndex(goLive);
      const end = start + life * 12;
      const a = Math.max(start, year * 12);
      const b = Math.min(end, year * 12 + 12);
      return Math.max(0, b - a);
    }

    function runPhases(phases: Gb300Phase[]) {
      const racks = phases.reduce((sum, p) => sum + p.rackCount, 0);
      return runModel(
        clampInputs({
          ...DEFAULT_INPUTS,
          skuGb300: { ...DEFAULT_INPUTS.skuGb300, rackCount: racks, phases },
        }),
      ).skuGb300;
    }

    const start = "2026-03";
    const cases: { name: string; lagMo: number; racks: number[] }[] = [
      { name: "2 phases · 3 mo", lagMo: 3, racks: [12, 12] },
      { name: "2 phases · 12 mo", lagMo: 12, racks: [12, 12] },
      { name: "3 phases · 3 mo", lagMo: 3, racks: [6, 6, 6] },
      { name: "3 phases · 12 mo", lagMo: 12, racks: [6, 6, 6] },
    ];

    for (const c of cases) {
      const phases: Gb300Phase[] = c.racks.map((rackCount, i) => ({
        id: `p${i + 1}`,
        goLive: addMonths(start, c.lagMo * i),
        rackCount,
      }));
      const got = runPhases(phases);
      const staggered = new Set(phases.map((p) => p.goLive)).size > 1;
      expect(got.axis === "calendar", c.name).toBe(staggered);
      expect(got.totalServers, c.name).toBe(c.racks.reduce((a, b) => a + b, 0));

      const sorted = [...phases].sort((a, b) => yearMonthIndex(a.goLive) - yearMonthIndex(b.goLive));
      const expectedCapex = sorted.reduce(
        (sum, p, i) => sum + phaseCapex(p, price, hall, container, i === 0),
        0,
      );
      expect(got.totalCapex, c.name).toBe(expectedCapex);
      expect(got.residualCash, c.name).toBe(got.serverCapex * residualPct);
      expect(got.irr, c.name).not.toBeNull();
      expect(Number.isFinite(got.npv), c.name).toBe(true);
      expect(got.breakevenMonth, c.name).not.toBeNull();
      expect(got.paybackYears, c.name).toBeGreaterThan(0);

      const years = new Set<number>();
      for (const p of phases) {
        const startIdx = yearMonthIndex(p.goLive);
        years.add(Math.floor(startIdx / 12));
        years.add(Math.floor((startIdx + life * 12 - 1) / 12));
      }
      const minY = Math.min(...years);
      const maxY = Math.max(...years);
      expect(got.years[0]?.year, c.name).toBe(minY);
      expect(got.years.at(-1)?.year, c.name).toBe(maxY);

      for (const row of got.years) {
        const expRev = phases.reduce(
          (sum, p) => sum + annualRevenue(p.rackCount) * (monthsLive(p.goLive, row.year) / 12),
          0,
        );
        const expElec = phases.reduce(
          (sum, p) => sum + annualElec(p.rackCount) * (monthsLive(p.goLive, row.year) / 12),
          0,
        );
        expect(row.revenue, `${c.name} ${row.year} rev`).toBeCloseTo(expRev, 4);
        expect(row.electricity, `${c.name} ${row.year} elec`).toBeCloseTo(expElec, 4);

        const expCapex = sorted.reduce((sum, p, i) => {
          return Math.floor(yearMonthIndex(p.goLive) / 12) === row.year
            ? sum + phaseCapex(p, price, hall, container, i === 0)
            : sum;
        }, 0);
        const impliedCapex = row.ncf + row.residualCash - row.cashFlow;
        expect(impliedCapex, `${c.name} ${row.year} capex`).toBeCloseTo(expCapex, 4);

        const expRes = phases.reduce((sum, p) => {
          const last = yearMonthIndex(p.goLive) + life * 12 - 1;
          return Math.floor(last / 12) === row.year ? sum + p.rackCount * price * residualPct : sum;
        }, 0);
        expect(row.residualCash, `${c.name} ${row.year} residual`).toBeCloseTo(expRes, 4);
      }

      if (c.lagMo === 12) {
        const bonusYears = phases.map((p) => Math.floor(yearMonthIndex(p.goLive) / 12));
        for (const year of bonusYears) {
          const row = got.years.find((y) => y.year === year);
          const expectedBonus = phases
            .filter((p) => Math.floor(yearMonthIndex(p.goLive) / 12) === year)
            .reduce((sum, p) => sum + p.rackCount * price * (1 - residualPct), 0);
          expect(row?.depreciation, `${c.name} bonus ${year}`).toBeCloseTo(expectedBonus, 4);
        }
      }

      if (c.lagMo === 3) {
        const y0 = got.years[0];
        const bonus = phases.reduce((sum, p) => sum + p.rackCount * price * (1 - residualPct), 0);
        expect(y0?.depreciation, `${c.name} all bonus Y1`).toBeCloseTo(bonus, 4);
      }
    }

    const sameCod = [
      { id: "p1", goLive: start, rackCount: 6 },
      { id: "p2", goLive: start, rackCount: 6 },
      { id: "p3", goLive: start, rackCount: 6 },
    ];
    const oneCard = runPhases([{ id: "p1", goLive: start, rackCount: 18 }]);
    const threeCards = runPhases(sameCod);
    expect(threeCards.axis ?? "model").toBe("model");
    expect(threeCards.totalCapex).toBe(oneCard.totalCapex);
    expect(threeCards.years[0]?.revenue).toBe(oneCard.years[0]?.revenue);
    expect(threeCards.y1Ncf).toBeCloseTo(oneCard.y1Ncf, 4);
    expect(threeCards.irr).toBeCloseTo(oneCard.irr ?? 0, 8);
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
