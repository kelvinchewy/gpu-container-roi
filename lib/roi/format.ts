import { combinedTax } from "./finance";
import type { ModelInputs, SkuId } from "./types";

export function usd(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function usdK(value: number): string {
  const k = Math.round(value / 1000);
  if (k === 0) return "$0k";
  const body = `$${Math.abs(k).toLocaleString("en-US")}k`;
  return k < 0 ? `-${body}` : body;
}

/** $000 for dense tables. Negatives in parentheses. */
export function usdParenK(value: number): string {
  const k = Math.round(value / 1000);
  if (k === 0) return "$0k";
  const body = `$${Math.abs(k).toLocaleString("en-US")}k`;
  return k < 0 ? `(${body})` : body;
}

export function usdCompact(value: number): string {
  return usdK(value);
}

export function pct(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function years(value: number | null, digits = 2): string {
  if (value == null) return "—";
  return `${value.toFixed(digits)} yrs`;
}

export function monthLabel(value: number | null): string {
  if (value == null) return "—";
  return `M${value}`;
}

export function multiple(value: number, digits = 2): string {
  return `${value.toFixed(digits)}x`;
}

export function kwh(value: number): string {
  return `$${value.toFixed(4)}/kWh`;
}

export function extrasSummary(inputs: ModelInputs, skuId?: SkuId): string {
  if (skuId === "gb300") {
    const f = inputs.gb300Facility;
    const site = f.siteName.trim() || "Atlanta, GA";
    const tax = combinedTax(f.federalTax, f.stateTax);
    const racks = inputs.skuGb300.rackCount ?? 24;
    return [
      site,
      `tax ${pct(tax, 1)}`,
      `${racks} racks`,
      `${f.hallCount} hall${f.hallCount === 1 ? "" : "s"}`,
      `PUE ${f.pue.toFixed(2)}`,
      `OBBBA ${f.obbbaEnabled ? "on" : "off"}`,
    ].join(" · ");
  }
  const site = inputs.siteName.trim() || "Atlanta, GA";
  const tax = combinedTax(inputs.federalTax, inputs.stateTax);
  return [
    site,
    `tax ${pct(tax, 1)}`,
    `${inputs.containerCount}×${inputs.serversPerContainer} servers`,
    `PUE ${inputs.pue.toFixed(2)}`,
    `OBBBA ${inputs.obbbaEnabled ? "on" : "off"}`,
  ].join(" · ");
}

export function chartCaption(inputs: ModelInputs, sku: string, skuId?: SkuId): string {
  const decay = `decay ${inputs.priceErosionOn ? "on" : "off"}`;
  if (skuId === "gb300") {
    return [
      sku,
      "NVL72",
      "Blackwell Ultra",
      extrasSummary(inputs, "gb300"),
      decay,
    ].join(" · ");
  }
  return `${sku} · ${extrasSummary(inputs)} · ${decay}`;
}
