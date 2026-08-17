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
  openrouterLlama70: "https://openrouter.ai/meta-llama/llama-3.3-70b-instruct",
  vast: "https://vast.ai/",
  runpod5090: "https://www.runpod.io/gpu-models/rtx-5090",
  runpodPro6000: "https://www.runpod.io/gpu-models/rtx-pro-6000",
  packet5090: "https://packet.ai/blog/rtx-5090-cloud-gpu-ai",
  spheron5090vsPro:
    "https://www.spheron.network/blog/rtx-5090-vs-rtx-pro-6000-blackwell-comparison/",
  dellProVsConsumer:
    "https://www.dell.com/en-us/blog/professional-vs-consumer-gpus-the-card-for-your-workflow/",
  mercatusLongContext: "https://www.mercatus-ai.com/blog/h100-vs-h200",
  pugetResolveVram:
    "https://thepostflow.com/post-production/editing-hardware/best-gpu-for-video-editing/",
  nvidia5090: "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/",
  nvidiaPro6000:
    "https://www.nvidia.com/en-us/products/workstations/rtx-pro-6000-blackwell-workstation-edition/",
} as const;

/** Measured 8 × RTX 5090, DeepSeek-V4-Flash-DSpark (284B MoE / 13B active, FP4+FP8), TP=8, 30 Jul 2026. Working hour is the 10:1 mix (16.3 M in + 1.63 M out), not tok/s × 3600. Flash does not fit on one 32 GB card. */
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

/** Listed OpenRouter meters for the Pro 6000 96 GB token check. No matching tok/s bench yet. */
export const LLAMA70_CHECK = {
  model: "Llama 3.3 70B Instruct",
  precision: "FP8",
  openrouterInPerM: 0.1,
  openrouterOutPerM: 0.32,
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
    model: "DeepSeek-V4-Flash · 8× TP=8",
    gpuRent: "$0.60",
    gpuRentWho: "On-demand avg",
    tokenHr: "$0.3425",
    tokenHrWho: "measured · 30 Jul 2026",
  },
  {
    sku: "RTX Pro 6000",
    model: "Llama 3.3 70B FP8 · 1×",
    gpuRent: "$1.69",
    gpuRentWho: "RunPod Community",
    tokenHr: "—",
    tokenHrWho: "placeholder",
  },
] as const;

/** Dated listed $/GPU-hr. Null = no public print that month. Do not interpolate in the chart. */
export const PRICE_LEVELS = [
  { m: "Aug 2025", sku5090: 0.88, pro6000: 1.79 },
  { m: "May 2026", sku5090: 0.76, pro6000: null },
  { m: "Jul 2026", sku5090: 0.56, pro6000: null },
  { m: "Aug 2026", sku5090: 0.54, pro6000: 2.19 },
] as const;

/** Cloud GPU instance $ mix, 2025. Dataintelo. Not SKU-specific. Job table uses the same keys. */
export const CLOUD_APP_SHARE = [
  { key: "ai", name: "AI", value: 38.5, fill: "var(--chart-1)" },
  { key: "analytics", name: "Analytics", value: 14.2, fill: "var(--chart-2)" },
  { key: "render", name: "Rendering", value: 12.8, fill: "var(--chart-3)" },
  { key: "science", name: "Scientific", value: 11.4, fill: "var(--chart-4)" },
  { key: "gaming", name: "Gaming", value: 10.3, fill: "var(--chart-5)" },
  { key: "other", name: "Other", value: 12.8, fill: "var(--muted-foreground)" },
] as const;

export type AppShareKey = (typeof CLOUD_APP_SHARE)[number]["key"];

/** Same categories as CLOUD_APP_SHARE. What fits on 32 GB vs 96 GB. No Good/Poor. */
export const USE_CASES_COMPARE = [
  {
    key: "ai",
    job: "Local LLM · chat",
    means: "Short Q&A with a small assistant. Both cards keep up.",
    sku5090:
      "7–13B FP16 or 32B Q4. Same tok/s as Pro 6000 while weights + short KV fit in 32 GB.",
    pro6000: "Same models. Extra VRAM unused unless batch or context grows.",
  },
  {
    key: "ai",
    job: "Local LLM · 70B",
    means: "A 70B-class model on one card. Weight size, not document length.",
    sku5090: "70B Q8 (~75 GB weights) spills to system RAM.",
    pro6000: "70B Q4 or FP8 on one card.",
  },
  {
    key: "ai",
    job: "Fine-tune",
    means: "Teaching the model on your data.",
    sku5090: "7–13B LoRA / QLoRA. 30B FP16 + grads OOM.",
    pro6000: "30B LoRA FP16; 70B QLoRA. No NVLink — not 70B FP16 train.",
  },
  {
    key: "analytics",
    job: "Long context / RAG",
    means: "One long document or codebase in a sitting. Leftover VRAM after weights is the KV cache.",
    sku5090: "13B FP16 at 8K+ KV fills the leftover GB.",
    pro6000: "~56–82 GB left for KV. 32k-token code/doc jobs stay in VRAM.",
  },
  {
    key: "render",
    job: "Image gen",
    means: "Pictures from text. Same speed on both; extra memory holds more style packs at once.",
    sku5090: "SDXL; Flux.1 Dev BF16 (~26 GB). Same img/min as Pro 6000.",
    pro6000: "Same img/min. 96 GB holds base + ControlNet + LoRA stack without reload.",
  },
  {
    key: "science",
    job: "CAD / MCAD",
    means: "Mechanical parts and assemblies (SOLIDWORKS, Creo) — not game/film lookdev.",
    sku5090: "No ISV cert. SOLIDWORKS OpenGL transparency (OIT) drops on GeForce drivers.",
    pro6000:
      "SOLIDWORKS, Creo, energy/medical viz — ISV/vWS, hardware OIT. Assemblies that exceed 32 GB.",
  },
  {
    key: "gaming",
    job: "Lookdev / Unreal",
    means: "Game or film viewport. Fine on 5090 until the scene itself is huge.",
    sku5090: "Maya / Unreal viewport (Lumen, Nanite) while the scene stays under 32 GB.",
    pro6000: "Same apps when the scene, textures, or sim cache exceeds 32 GB.",
  },
  {
    key: "other",
    job: "Video · 1080 / 4K / 8K",
    means: "Cutting and exporting video. 1080 and 4K are easy on both; 8K and stacked effects need more memory.",
    sku5090:
      "1080 (~8 GB) and 4K (~12 GB) timelines. 6K/8K + NR/Magic Mask in 32 GB. 3× NVENC, 2× NVDEC.",
    pro6000:
      "Same 1080/4K encode. 4× NVENC / 4× NVDEC for multi-stream. 96 GB for 8K + Fusion/color stack without swapping.",
  },
] as const;

/** Cloud rental listings, getdeploying, 15 Aug 2026. Supply, not demand. */
export const LISTING_SHARE = [
  { key: "sku5090", name: "RTX 5090", value: 104, fill: "var(--chart-2)" },
  { key: "pro6000", name: "Pro 6000", value: 207, fill: "var(--chart-1)" },
] as const;
