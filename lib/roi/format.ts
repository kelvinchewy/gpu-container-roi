import { combinedTax } from "./finance";
import type { ModelInputs } from "./types";

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
  const sign = k < 0 ? "-" : "";
  return `${sign}$${Math.abs(k).toLocaleString("en-US")}k`;
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

export function extrasSummary(inputs: ModelInputs): string {
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

export function chartCaption(inputs: ModelInputs, sku: string): string {
  return `${sku} · ${extrasSummary(inputs)} · decay ${inputs.priceErosionOn ? "on" : "off"}`;
}
