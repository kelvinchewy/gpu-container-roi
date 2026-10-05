import { DEFAULT_GB300_FACILITY, DEFAULT_INPUTS, GB300_GPUS_PER_RACK, SKU_LABEL } from "./defaults";
import { combinedTax, irr, npv, paybackYears } from "./finance";
import {
  clampGb300Phases,
  gb300PhasesAreStaggered,
  phaseCapex,
  phaseServerCapex,
  phaseSite,
  totalGb300Racks,
  yearMonthIndex,
} from "./phases";
import type { ModelInputs, SkuResult, YearRow } from "./types";

function monthlyRate(annual: number): number {
  return (1 + annual) ** (1 / 12) - 1;
}

function annualizeMonthlyIrr(monthly: number | null): number | null {
  if (monthly == null) return null;
  return (1 + monthly) ** 12 - 1;
}

export function runGb300Staggered(inputs: ModelInputs): SkuResult {
  const sku = inputs.skuGb300;
  const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
  const phases = clampGb300Phases(sku);
  const n = Math.round(f.usefulLifeYrs);
  const combined = combinedTax(f.federalTax, f.stateTax);
  const rackPrice = sku.serverPrice;
  const hall = f.hallCount;
  const gpusPer = GB300_GPUS_PER_RACK;
  const totalServers = totalGb300Racks(phases);
  const totalGpus = totalServers * gpusPer;
  const sorted = [...phases].sort((a, b) => yearMonthIndex(a.goLive) - yearMonthIndex(b.goLive));

  let serverCapex = 0;
  let infraCapex = 0;
  const phaseMeta = sorted.map((phase, i) => {
    const start = yearMonthIndex(phase.goLive);
    const capex = phaseCapex(phase, rackPrice, hall, f.containerCost, i === 0);
    const servers = phaseServerCapex(phase, rackPrice);
    const infra = capex - servers;
    serverCapex += servers;
    infraCapex += infra;
    const billed = phase.rackCount;
    const revenueY1 = billed * sku.gpuRentPerHr * f.hoursPerYear * sku.utilization;
    const electricity = phase.rackCount * sku.itLoadKw * f.pue * f.elecPerKwh * f.hoursPerYear;
    const insuranceY1 = revenueY1 * f.insurancePctRev;
    const otherY1 = revenueY1 * f.otherOpexPctRev;
    return {
      phase,
      start,
      end: start + n * 12,
      capex,
      servers,
      infra,
      basis: servers * (1 - sku.residualPct),
      residual: servers * sku.residualPct,
      revenueY1,
      electricity,
      insuranceY1,
      otherY1,
    };
  });

  const totalCapex = serverCapex + infraCapex;
  const itLoadTotalKw = totalServers * sku.itLoadKw;
  const totalPowerKw = itLoadTotalKw * f.pue;
  const first = phaseMeta[0]!.start;
  const last = Math.max(...phaseMeta.map((p) => p.end));
  const networkYear = f.networkOpexMo * 12 * hall;
  const omYear = f.omOpexMo * 12 * hall;
  const months: {
    index: number;
    revenue: number;
    electricity: number;
    network: number;
    om: number;
    insurance: number;
    propertyTax: number;
    otherOpex: number;
    capex: number;
    residual: number;
  }[] = [];

  for (let t = first; t < last; t++) {
    let revenue = 0;
    let electricity = 0;
    let insurance = 0;
    let otherOpex = 0;
    let propertyTax = 0;
    let capex = 0;
    let residual = 0;
    let live = false;
    for (const p of phaseMeta) {
      if (t === p.start) capex += p.capex;
      if (t >= p.start && t < p.end) {
        live = true;
        const opYear = Math.floor((t - p.start) / 12);
        const erosion = inputs.priceErosionOn ? (1 - inputs.priceErosionRate) ** opYear : 1;
        const rev = (p.revenueY1 * erosion) / 12;
        revenue += rev;
        electricity += p.electricity / 12;
        insurance += inputs.priceErosionOn ? p.insuranceY1 / 12 : rev * f.insurancePctRev;
        otherOpex += inputs.priceErosionOn ? p.otherY1 / 12 : rev * f.otherOpexPctRev;
        propertyTax += (p.capex * f.propertyTaxPctCapex) / 12;
      }
      if (t === p.end - 1) residual += p.residual;
    }
    const network = live ? networkYear / 12 : 0;
    const om = live ? omYear / 12 : 0;
    months.push({
      index: t,
      revenue,
      electricity,
      network,
      om,
      insurance,
      propertyTax,
      otherOpex,
      capex,
      residual,
    });
  }

  const byYear = new Map<number, typeof months>();
  for (const m of months) {
    const year = Math.floor(m.index / 12);
    const list = byYear.get(year) ?? [];
    list.push(m);
    byYear.set(year, list);
  }
  const calendarYears = [...byYear.keys()].sort((a, b) => a - b);

  const years: YearRow[] = [];
  const monthlyCf: number[] = [];
  let remainingNol = 0;
  let cumulative = 0;
  let slDepTotal = 0;

  for (const year of calendarYears) {
    const chunk = byYear.get(year) ?? [];
    const revenue = chunk.reduce((s, m) => s + m.revenue, 0);
    const electricity = chunk.reduce((s, m) => s + m.electricity, 0);
    const network = chunk.reduce((s, m) => s + m.network, 0);
    const om = chunk.reduce((s, m) => s + m.om, 0);
    const insurance = chunk.reduce((s, m) => s + m.insurance, 0);
    const propertyTax = chunk.reduce((s, m) => s + m.propertyTax, 0);
    const otherOpex = chunk.reduce((s, m) => s + m.otherOpex, 0);
    const totalOpex = electricity + network + om + insurance + propertyTax + otherOpex;
    const ebitda = revenue - totalOpex;
    const capex = chunk.reduce((s, m) => s + m.capex, 0);
    const residualCash = chunk.reduce((s, m) => s + m.residual, 0);

    let depreciation = 0;
    if (!f.obbbaEnabled) {
      for (const p of phaseMeta) {
        const liveMonths = chunk.filter((m) => m.index >= p.start && m.index < p.end).length;
        if (n > 0) depreciation += (p.basis / n) * (liveMonths / 12);
      }
      slDepTotal += depreciation;
    } else {
      for (const p of phaseMeta) {
        if (Math.floor(p.start / 12) === year) depreciation += p.basis;
      }
    }

    let ebit = ebitda - depreciation;
    let taxableIncome = 0;
    let tax = 0;
    if (!f.obbbaEnabled) {
      taxableIncome = ebit;
      tax = ebit * combined;
    } else {
      let taxable = ebitda - depreciation;
      if (taxable < 0) {
        remainingNol += -taxable;
        taxableIncome = taxable;
        tax = 0;
      } else {
        const maxOffset = depreciation > 0 ? 0 : 0.8 * Math.max(ebitda, 0);
        const used = Math.min(remainingNol, maxOffset);
        remainingNol -= used;
        taxableIncome = taxable - used;
        tax = Math.max(0, taxableIncome) * combined;
      }
    }

    const ncf = ebitda - tax;
    const cashFlow = ncf - capex + residualCash;
    cumulative += cashFlow;
    const taxPerMonth = chunk.length ? tax / chunk.length : 0;
    for (const m of chunk) {
      const ebitdaM =
        m.revenue - (m.electricity + m.network + m.om + m.insurance + m.propertyTax + m.otherOpex);
      monthlyCf.push(ebitdaM - taxPerMonth - m.capex + m.residual);
    }

    years.push({
      year,
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
      residualCash,
      cashFlow,
      cumulative,
    });
  }

  const paybackPeriods = paybackYears(monthlyCf);
  const payback = paybackPeriods == null ? null : paybackPeriods / 12;
  const breakevenMonth = paybackPeriods == null ? null : Math.ceil(paybackPeriods);
  const operatingNcf = years.reduce((s, y) => s + y.ncf, 0);
  const avgNcf = years.length ? operatingNcf / years.length : 0;
  const inflow = years.reduce((s, y) => s + y.ncf + y.residualCash, 0);
  const y1 = years[0];
  const gpus = totalGpus || 1;
  const kw = totalPowerKw || 1;
  const residualCash = phaseMeta.reduce((s, p) => s + p.residual, 0);
  const depreciableBasis = phaseMeta.reduce((s, p) => s + p.basis, 0);

  return {
    skuId: "gb300",
    skuLabel: SKU_LABEL.gb300,
    combinedTax: combined,
    totalServers,
    totalGpus,
    infraCapex,
    serverCapex,
    totalCapex,
    itLoadTotalKw,
    totalPowerKw,
    effectiveKwh: f.elecPerKwh * f.pue,
    depreciableBasis,
    residualCash,
    slDep: n > 0 && !f.obbbaEnabled ? depreciableBasis / n : slDepTotal / Math.max(years.length, 1),
    years,
    cashFlows: years.map((y) => y.cashFlow),
    axis: "calendar",
    y1Ncf: y1?.ncf ?? 0,
    paybackYears: payback,
    breakevenMonth,
    irr: annualizeMonthlyIrr(irr(monthlyCf)),
    npv: npv(monthlyCf, monthlyRate(inputs.discountRate)),
    cashOnCash: totalCapex > 0 ? avgNcf / totalCapex : 0,
    totalRoi: totalCapex > 0 ? inflow / totalCapex - 1 : 0,
    moic: totalCapex > 0 ? inflow / totalCapex : 0,
    revenuePerGpu: (y1?.revenue ?? 0) / gpus,
    opexPerGpu: (y1?.totalOpex ?? 0) / gpus,
    ncfPerGpu: (y1?.ncf ?? 0) / gpus,
    capexPerGpu: totalCapex / gpus,
    revenuePerKw: (y1?.revenue ?? 0) / kw,
    ncfPerKw: (y1?.ncf ?? 0) / kw,
  };
}

export function shouldRunGb300Staggered(inputs: ModelInputs): boolean {
  return gb300PhasesAreStaggered(clampGb300Phases(inputs.skuGb300 ?? DEFAULT_INPUTS.skuGb300));
}
