import { DEFAULT_INPUTS, SKU_LABEL } from "./defaults";
import { combinedTax, irr, npv, paybackYears } from "./finance";
import type {
  ModelInputs,
  ModelResult,
  SkuId,
  SkuInputs,
  SkuResult,
  YearRow,
} from "./types";

function skuInputs(inputs: ModelInputs, skuId: SkuId): SkuInputs {
  return skuId === "5090" ? inputs.sku5090 : inputs.skuPro6000;
}

function runSku(inputs: ModelInputs, skuId: SkuId): SkuResult {
  const sku = skuInputs(inputs, skuId);
  const n = Math.round(inputs.usefulLifeYrs);
  const combined = combinedTax(inputs.federalTax, inputs.stateTax);
  const totalServers = inputs.containerCount * inputs.serversPerContainer;
  const totalGpus = totalServers * inputs.gpusPerServer;
  const infraCapex =
    (inputs.containerCost + inputs.siteConstruction) * inputs.containerCount;
  const serverCapex = totalServers * sku.serverPrice;
  const totalCapex = serverCapex + infraCapex;
  const itLoadTotalKw = totalServers * sku.itLoadKw;
  const totalPowerKw = itLoadTotalKw * inputs.pue;
  const effectiveKwh = inputs.elecPerKwh * inputs.pue;
  const depreciableBasis = serverCapex * (1 - sku.residualPct);
  const residualCash = serverCapex * sku.residualPct;
  const slDep = n > 0 ? depreciableBasis / n : 0;

  const revenueY1 =
    totalGpus * sku.gpuRentPerHr * inputs.hoursPerYear * sku.utilization;
  const electricity =
    totalServers * sku.itLoadKw * inputs.pue * inputs.elecPerKwh * inputs.hoursPerYear;
  const network = inputs.networkOpexMo * 12 * inputs.containerCount;
  const om = inputs.omOpexMo * 12 * inputs.containerCount;
  const propertyTax = totalCapex * inputs.propertyTaxPctCapex;
  const insuranceY1 = revenueY1 * inputs.insurancePctRev;
  const otherY1 = revenueY1 * inputs.otherOpexPctRev;
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
      : revenue * inputs.insurancePctRev;
    const otherOpex = inputs.priceErosionOn
      ? otherY1
      : revenue * inputs.otherOpexPctRev;
    const totalOpex = inputs.priceErosionOn
      ? opexY1
      : electricity + network + om + insurance + propertyTax + otherOpex;
    const ebitda = revenue - totalOpex;

    let depreciation = 0;
    let ebit = ebitda;
    let taxableIncome = 0;
    let tax = 0;
    let ncf = 0;

    if (!inputs.obbbaEnabled) {
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
  };
}

export function runSkuModel(inputs: ModelInputs, skuId: SkuId): SkuResult {
  return runSku(inputs, skuId);
}
