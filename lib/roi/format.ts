import { combinedTax } from "./finance";
import { DEFAULT_GB300_FACILITY } from "./defaults";
import { t, type Locale } from "./i18n";
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

export function years(value: number | null, digits = 2, locale: Locale = "en"): string {
  if (value == null) return "—";
  return t(locale, "yrs", { value: value.toFixed(digits) });
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

export function extrasSummary(
  inputs: ModelInputs,
  skuId?: SkuId,
  locale: Locale = "en",
): string {
  if (skuId === "gb300") {
    const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
    const site = f.siteName.trim() || "Atlanta, GA";
    const tax = combinedTax(f.federalTax, f.stateTax);
    const racks = inputs.skuGb300.rackCount ?? 24;
    return [
      site,
      t(locale, "taxChip", { value: pct(tax, 1) }),
      t(locale, "racksCount", { n: racks }),
      t(locale, f.hallCount === 1 ? "hallCount" : "hallsCount", { n: f.hallCount }),
      `PUE ${f.pue.toFixed(2)}`,
      t(locale, f.obbbaEnabled ? "obbbaOn" : "obbbaOff"),
    ].join(" · ");
  }
  const site = inputs.siteName.trim() || "Atlanta, GA";
  const tax = combinedTax(inputs.federalTax, inputs.stateTax);
  return [
    site,
    t(locale, "taxChip", { value: pct(tax, 1) }),
    t(locale, "serversCount", {
      a: inputs.containerCount,
      b: inputs.serversPerContainer,
    }),
    `PUE ${inputs.pue.toFixed(2)}`,
    t(locale, inputs.obbbaEnabled ? "obbbaOn" : "obbbaOff"),
  ].join(" · ");
}

export function chartCaption(
  inputs: ModelInputs,
  sku: string,
  skuId?: SkuId,
  locale: Locale = "en",
): string {
  const decay = t(locale, inputs.priceErosionOn ? "decayOn" : "decayOffChip");
  if (skuId === "gb300") {
    return [
      sku,
      "NVL72",
      "Blackwell Ultra",
      extrasSummary(inputs, "gb300", locale),
      decay,
    ].join(" · ");
  }
  return `${sku} · ${extrasSummary(inputs, undefined, locale)} · ${decay}`;
}
