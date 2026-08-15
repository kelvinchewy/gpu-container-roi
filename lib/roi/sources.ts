import type { BomLine, SkuId } from "./types";

export type { BomLine };

export function bomSum(lines: BomLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}

export function cloneBom(lines: BomLine[]): BomLine[] {
  return lines.map((line) => ({ ...line }));
}

export function syncBomToPrice(lines: BomLine[], target: number): BomLine[] {
  const next = cloneBom(lines);
  const plug = next.find((line) => line.key === "other") ?? next[next.length - 1];
  if (!plug) return next;
  const rest = bomSum(next) - plug.qty * plug.unitPrice;
  const qty = plug.qty > 0 ? plug.qty : 1;
  plug.qty = qty;
  plug.unitPrice = Math.max(0, (target - rest) / qty);
  return next;
}

/** Hardware lines + Other. Other is the plug so the total equals Excel server price. */
export const DEFAULT_BOM: Record<SkuId, BomLine[]> = {
  "5090": [
    { key: "gpu", item: "NVIDIA RTX 5090 32GB", qty: 8, unitPrice: 4_500 },
    { key: "platform", item: "Server platform (ASUS ESC4000A-E12, 4U)", qty: 1, unitPrice: 10_000 },
    { key: "cpu", item: "CPU (AMD EPYC 9354P, 32-core)", qty: 2, unitPrice: 2_500 },
    { key: "memory", item: "Memory (DDR5 ECC 512GB)", qty: 1, unitPrice: 3_000 },
    { key: "nvme", item: "NVMe + network", qty: 1, unitPrice: 2_000 },
    { key: "cables", item: "Cables, fans, other", qty: 1, unitPrice: 4_000 },
    { key: "other", item: "Other", qty: 1, unitPrice: 28_200 },
  ],
  pro6000: [
    { key: "gpu", item: "NVIDIA RTX Pro 6000 Blackwell 96GB", qty: 8, unitPrice: 13_250 },
    { key: "platform", item: "Server platform (ASUS ESC8000A-E12P)", qty: 1, unitPrice: 22_000 },
    { key: "cpu", item: "CPU (AMD EPYC 9554P, 64-core)", qty: 2, unitPrice: 4_000 },
    { key: "memory", item: "Memory (DDR5 ECC 1TB)", qty: 1, unitPrice: 4_000 },
    { key: "nvme", item: "NVMe + network", qty: 1, unitPrice: 2_000 },
    { key: "cables", item: "Cables, fans, other", qty: 1, unitPrice: 4_000 },
    { key: "other", item: "Other", qty: 1, unitPrice: 45_800 },
  ],
};

export type RentComp = {
  low: string;
  mid: string;
  high: string;
  sources: string;
  ecohash: string;
};

/** Independent listed prints, 15 Aug 2026. Do not feed the calculator unless asked. */
export const CONTEXT_AS_OF = "15 Aug 2026";

export const ECOHASH_LIST = {
  gpuHr5090: "—",
  gpuHrPro6000: "$1.98",
  flashIn: "$0.16",
  flashOut: "$0.33",
  apiFloor: "$0.02",
  pricingUrl: "https://ecohash.com/pricing",
  gpuUrl: "https://ecohash.com/gpu/rtx-pro-6000",
} as const;

export const RENT_SOURCE: Record<SkuId, RentComp> = {
  "5090": {
    low: "$0.34/hr",
    mid: "$0.60/hr",
    high: "$0.99/hr",
    sources: "Vast $0.34 · on-demand avg $0.60 · RunPod Secure $0.99 · 15 Aug 2026",
    ecohash: "—",
  },
  pro6000: {
    low: "$0.66/hr",
    mid: "$1.69/hr",
    high: "$5.50/hr",
    sources:
      "Packet.ai $0.66 · RunPod Community $1.69 · Azure $5.50 · 15 Aug 2026",
    ecohash: "$1.98/hr",
  },
};

export const GPU_HR_COMPARE = [
  {
    sku: "RTX 5090",
    ecohash: "—",
    ecohashWho: "No SKU",
    low: "$0.34",
    lowWho: "Vast",
    mid: "$0.60",
    midWho: "On-demand avg",
    high: "$0.99",
    highWho: "RunPod Secure",
  },
  {
    sku: "RTX Pro 6000",
    ecohash: "$1.98",
    ecohashWho: "EcoHash",
    low: "$0.66",
    lowWho: "Packet.ai",
    mid: "$1.69",
    midWho: "RunPod Community",
    high: "$5.50",
    highWho: "Azure",
  },
] as const;

export const CITE = {
  listing5090: "https://getdeploying.com/gpus/nvidia-rtx-5090",
  listingPro6000: "https://getdeploying.com/gpus/nvidia-rtx-pro-6000",
  dataintelo: "https://dataintelo.com/report/cloud-gpu-instance-market",
  ecohashPricing: "https://ecohash.com/pricing",
  openrouterFlash: "https://openrouter.ai/deepseek/deepseek-v4-flash",
  vast: "https://vast.ai/",
  runpod5090: "https://www.runpod.io/gpu-models/rtx-5090",
  runpodPro6000: "https://www.runpod.io/gpu-models/rtx-pro-6000",
  packet5090: "https://packet.ai/blog/rtx-5090-cloud-gpu-ai",
} as const;

/** Measured 8 × RTX 5090 full load, DeepSeek-V4-Flash. Working hour is the 10:1 mix (16.3 M in + 1.63 M out), not tok/s × 3600. */
export const FLASH_LOAD = {
  gpus: 8,
  inTokPerSec: 6_500,
  outTokPerSec: 1_500,
  inOutRatio: 10,
  inPerHourM: 16.3,
  outPerHourM: 1.63,
  openrouterInPerM: 0.14,
  openrouterOutPerM: 0.28,
  usdPerHour8: 2.74,
  usdPerGpuHr: 0.3425,
} as const;

export const TOKEN_BILLING = [
  {
    meter: "Input",
    what: "Prompt · what you send",
    openrouter: "$0.14 / M",
    ecohash: "$0.16 / M",
  },
  {
    meter: "Output",
    what: "Completion · what the model writes",
    openrouter: "$0.28 / M",
    ecohash: "$0.33 / M",
  },
] as const;

export const UNIT_COMPARE = [
  {
    sku: "RTX 5090",
    gpuRent: "$0.60",
    gpuRentWho: "On-demand avg",
    tokenHr: "$0.3425",
    tokenHrWho: "derived · full load",
  },
  {
    sku: "RTX Pro 6000",
    gpuRent: "$1.69",
    gpuRentWho: "RunPod Community",
    tokenHr: "—",
    tokenHrWho: "No matching bench",
  },
] as const;

/** Dated listed $/GPU-hr. Null = no public print that month. Do not interpolate in the chart. */
export const PRICE_LEVELS = [
  { m: "Aug 2025", sku5090: 0.88, pro6000: 1.79 },
  { m: "May 2026", sku5090: 0.76, pro6000: null },
  { m: "Jul 2026", sku5090: 0.56, pro6000: null },
  { m: "Aug 2026", sku5090: 0.54, pro6000: 2.19 },
] as const;

export const USE_CASES_COMPARE = [
  {
    job: "Inference",
    sku5090: "7–13B FP16 · Good",
    pro6000: "20–35B FP16 · 70B Q · Good",
  },
  {
    job: "Agents / coding",
    sku5090: "32B quantized · OK · 32 GB KV",
    pro6000: "70B · long context · Good",
  },
  {
    job: "Media / VFX",
    sku5090: "SD / Flux · Good until >32 GB",
    pro6000: "Dense scenes · 96 GB · Good",
  },
  {
    job: "CAD / design",
    sku5090: "Poor · GeForce drivers",
    pro6000: "Intended · ISV / vWS",
  },
  {
    job: "Research / fine-tune",
    sku5090: "LoRA small–mid · Good",
    pro6000: "70B QLoRA · Good · no NVLink",
  },
] as const;

/** Cloud rental listings, getdeploying, 15 Aug 2026. Supply, not demand. */
export const LISTING_SHARE = [
  { key: "sku5090", name: "RTX 5090", value: 104, fill: "var(--chart-2)" },
  { key: "pro6000", name: "Pro 6000", value: 207, fill: "var(--chart-1)" },
] as const;

/** Cloud GPU instance $ mix, 2025. Dataintelo. Not SKU-specific. */
export const CLOUD_APP_SHARE = [
  { key: "ai", name: "AI", value: 38.5, fill: "var(--chart-1)" },
  { key: "analytics", name: "Analytics", value: 14.2, fill: "var(--chart-2)" },
  { key: "render", name: "Rendering", value: 12.8, fill: "var(--chart-3)" },
  { key: "science", name: "Scientific", value: 11.4, fill: "var(--chart-4)" },
  { key: "gaming", name: "Gaming", value: 10.3, fill: "var(--chart-5)" },
  { key: "other", name: "Other", value: 12.8, fill: "var(--muted-foreground)" },
] as const;
