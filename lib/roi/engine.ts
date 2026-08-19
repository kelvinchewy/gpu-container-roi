import { DEFAULT_GB300_FACILITY, DEFAULT_INPUTS, SKU_LABEL } from "./defaults";
import { combinedTax, irr, npv, paybackYears } from "./finance";
import type { Gb300Facility, ModelInputs, ModelResult, SkuId, SkuResult, YearRow } from "./types";
import { skuState } from "./types";

function facility(inputs: ModelInputs, skuId: SkuId) {
  if (skuId === "gb300") {
    const f: Gb300Facility = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
    return {
      siteName: f.siteName,
      elecPerKwh: f.elecPerKwh,
      federalTax: f.federalTax,
      stateTax: f.stateTax,
      propertyTaxPctCapex: f.propertyTaxPctCapex,
      obbbaEnabled: f.obbbaEnabled,
      pue: f.pue,
      hoursPerYear: f.hoursPerYear,
      usefulLifeYrs: f.usefulLifeYrs,
      scaleCount: f.hallCount,
      containerCost: f.containerCost,
      siteConstruction: f.siteConstruction,
      networkOpexMo: f.networkOpexMo,
      omOpexMo: f.omOpexMo,
      insurancePctRev: f.insurancePctRev,
      otherOpexPctRev: f.otherOpexPctRev,
    };
  }
  return {
    siteName: inputs.siteName,
    elecPerKwh: inputs.elecPerKwh,
    federalTax: inputs.federalTax,
    stateTax: inputs.stateTax,
    propertyTaxPctCapex: inputs.propertyTaxPctCapex,
    obbbaEnabled: inputs.obbbaEnabled,
    pue: inputs.pue,
    hoursPerYear: inputs.hoursPerYear,
    usefulLifeYrs: inputs.usefulLifeYrs,
    scaleCount: inputs.containerCount,
    containerCost: inputs.containerCost,
    siteConstruction: inputs.siteConstruction,
    networkOpexMo: inputs.networkOpexMo,
    omOpexMo: inputs.omOpexMo,
    insurancePctRev: inputs.insurancePctRev,
    otherOpexPctRev: inputs.otherOpexPctRev,
  };
}

function runSku(inputs: ModelInputs, skuId: SkuId): SkuResult {
  const sku = skuState(inputs, skuId);
  const f = facility(inputs, skuId);
  const n = Math.round(f.usefulLifeYrs);
  const combined = combinedTax(f.federalTax, f.stateTax);
  const totalServers =
    skuId === "gb300"
      ? (sku.rackCount ?? DEFAULT_INPUTS.skuGb300.rackCount ?? 24)
      : inputs.containerCount * inputs.serversPerContainer;
  const gpusPer =
    skuId === "gb300"
      ? (sku.gpusPerServer ?? DEFAULT_INPUTS.skuGb300.gpusPerServer ?? 72)
      : (sku.gpusPerServer ?? inputs.gpusPerServer);
  const totalGpus = totalServers * gpusPer;
  const infraCapex = (f.containerCost + f.siteConstruction) * f.scaleCount;
  const serverCapex = totalServers * sku.serverPrice;
  const totalCapex = serverCapex + infraCapex;
  const itLoadTotalKw = totalServers * sku.itLoadKw;
  const totalPowerKw = itLoadTotalKw * f.pue;
  const effectiveKwh = f.elecPerKwh * f.pue;
  const depreciableBasis = serverCapex * (1 - sku.residualPct);
  const residualCash = serverCapex * sku.residualPct;
  const slDep = n > 0 ? depreciableBasis / n : 0;

  const billedUnits = skuId === "gb300" ? totalServers : totalGpus;
  const revenueY1 =
    billedUnits * sku.gpuRentPerHr * f.hoursPerYear * sku.utilization;
  const electricity =
    totalServers * sku.itLoadKw * f.pue * f.elecPerKwh * f.hoursPerYear;
  const network = f.networkOpexMo * 12 * f.scaleCount;
  const om = f.omOpexMo * 12 * f.scaleCount;
  const propertyTax = totalCapex * f.propertyTaxPctCapex;
  const insuranceY1 = revenueY1 * f.insurancePctRev;
  const otherY1 = revenueY1 * f.otherOpexPctRev;
  const opexY1 = electricity + network + om + insuranceY1 + propertyTax + otherY1;

  const years: YearRow[] = [];
  let remainingNol = 0;
  let cumulative = -totalCapex;
  const cashFlows: number[] = [-totalCapex];

  for (let t = 1; t <= n; t++) {
    const revenue = inputs.priceErosionOn
      ? revenueY1 * (1 - inputs.priceErosionRate) ** (t - 1)
      : revenueY1;

    // Excel OBBBA erosion block subtracts Y1 total OpEx from each year's revenue
    // (insurance / other stay at Y1). Same treatment for both paths.
    const insurance = inputs.priceErosionOn
      ? insuranceY1
      : revenue * f.insurancePctRev;
    const otherOpex = inputs.priceErosionOn
      ? otherY1
      : revenue * f.otherOpexPctRev;
    const totalOpex = inputs.priceErosionOn
      ? opexY1
      : electricity + network + om + insurance + propertyTax + otherOpex;
    const ebitda = revenue - totalOpex;

    let depreciation = 0;
    let ebit = ebitda;
    let taxableIncome = 0;
    let tax = 0;
    let ncf = 0;

    if (!f.obbbaEnabled) {
      depreciation = slDep;
      ebit = ebitda - slDep;
      taxableIncome = ebit;
      tax = ebit * combined;
      ncf = ebitda - tax;
    } else if (t === 1) {
      depreciation = depreciableBasis;
      ebit = ebitda - depreciableBasis;
      taxableIncome = ebitda - depreciableBasis;
      if (taxableIncome < 0) {
        remainingNol = -taxableIncome;
        tax = 0;
      } else {
        remainingNol = 0;
        tax = taxableIncome * combined;
      }
      ncf = ebitda - tax;
    } else {
      const maxOffset = 0.8 * Math.max(ebitda, 0);
      const used = Math.min(remainingNol, maxOffset);
      remainingNol -= used;
      taxableIncome = ebitda - used;
      tax = Math.max(0, taxableIncome) * combined;
      ncf = ebitda - tax;
    }

    const residualThisYear = t === n ? residualCash : 0;
    const cashFlow = ncf + residualThisYear;
    cumulative += cashFlow;
    cashFlows.push(cashFlow);

    years.push({
      year: t,
      revenue,
      electricity,
      network,
      om,
      insurance,
      propertyTax,
      otherOpex,
      totalOpex,
      ebitda,
      depreciation,
      ebit,
      taxableIncome,
      tax,
      nolRemaining: remainingNol,
      ncf,
      residualCash: residualThisYear,
      cashFlow,
      cumulative,
    });
  }

  const payback = paybackYears(cashFlows);
  const breakevenMonth =
    payback == null ? null : Math.ceil(payback * 12);

  const avgNcf =
    years.length > 0
      ? years.reduce((sum, y) => sum + y.ncf, 0) / years.length
      : 0;
  const inflow = cashFlows.slice(1).reduce((sum, v) => sum + v, 0);
  const cashOnCash = totalCapex > 0 ? avgNcf / totalCapex : 0;
  const moic = totalCapex > 0 ? inflow / totalCapex : 0;
  const y1 = years[0];
  const gpus = totalGpus || 1;
  const kw = totalPowerKw || 1;

  return {
    skuId,
    skuLabel: SKU_LABEL[skuId],
    combinedTax: combined,
    totalServers,
    totalGpus,
    infraCapex,
    serverCapex,
    totalCapex,
    itLoadTotalKw,
    totalPowerKw,
    effectiveKwh,
    depreciableBasis,
    residualCash,
    slDep,
    years,
    cashFlows,
    y1Ncf: cashFlows[1] ?? 0,
    paybackYears: payback,
    breakevenMonth,
    irr: irr(cashFlows),
    npv: npv(cashFlows, inputs.discountRate),
    cashOnCash,
    totalRoi: moic - 1,
    moic,
    revenuePerGpu: (y1?.revenue ?? 0) / gpus,
    opexPerGpu: (y1?.totalOpex ?? 0) / gpus,
    ncfPerGpu: (y1?.ncf ?? 0) / gpus,
    capexPerGpu: totalCapex / gpus,
    revenuePerKw: (y1?.revenue ?? 0) / kw,
    ncfPerKw: (y1?.ncf ?? 0) / kw,
  };
}

export function runModel(inputs: ModelInputs = DEFAULT_INPUTS): ModelResult {
  return {
    sku5090: runSku(inputs, "5090"),
    skuPro6000: runSku(inputs, "pro6000"),
    skuGb300: runSku(inputs, "gb300"),
  };
}

export function runSkuModel(inputs: ModelInputs, skuId: SkuId): SkuResult {
  return runSku(inputs, skuId);
}
