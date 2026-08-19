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
  gb300: [{ key: "rack", item: "GB300 NVL72 rack", qty: 1, unitPrice: 5_000_000 }],
};

export type RentComp = {
  low: string;
  mid: string;
  high: string;
  sources: string;
  ecohash: string;
};

export const RENT_SOURCE: Record<Exclude<SkuId, "gb300">, RentComp> = {
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

export const CITE = {
  listing5090: "https://getdeploying.com/gpus/nvidia-rtx-5090",
  listingPro6000: "https://getdeploying.com/gpus/nvidia-rtx-pro-6000",
  ecohashPricing: "https://ecohash.com/pricing",
  vast: "https://vast.ai/",
  runpod5090: "https://www.runpod.io/gpu-models/rtx-5090",
  runpodPro6000: "https://www.runpod.io/gpu-models/rtx-pro-6000",
  packet5090: "https://packet.ai/blog/rtx-5090-cloud-gpu-ai",
} as const;
