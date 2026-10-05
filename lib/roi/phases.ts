import {
  BOUNDS,
  DEFAULT_GB300_FACILITY,
  GB300_GPUS_PER_RACK,
  GB300_RACK_BLOCK,
  gb300SiteConstruction,
  snapGb300Racks,
} from "./defaults";
import { clamp } from "./finance";
import type { Gb300Phase, ModelInputs, SkuInputs } from "./types";

export const GB300_PHASE_MAX = 8;
export const GB300_GO_LIVE_MIN = "2025-01";
export const GB300_GO_LIVE_MAX = "2035-12";
export const DEFAULT_GB300_GO_LIVE = "2026-03";

export function parseYearMonth(raw: string | undefined): { year: number; month: number } | null {
  if (!raw) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function yearMonthIndex(raw: string): number {
  const p = parseYearMonth(raw);
  if (!p) return yearMonthIndex(DEFAULT_GB300_GO_LIVE);
  return p.year * 12 + (p.month - 1);
}

export function yearMonthFromIndex(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return formatYearMonth(year, month);
}

export function clampYearMonth(raw: string | undefined): string {
  const p = parseYearMonth(raw) ?? parseYearMonth(DEFAULT_GB300_GO_LIVE)!;
  const idx = clamp(
    p.year * 12 + (p.month - 1),
    yearMonthIndex(GB300_GO_LIVE_MIN),
    yearMonthIndex(GB300_GO_LIVE_MAX),
  );
  return yearMonthFromIndex(idx);
}

export function addMonths(raw: string, delta: number): string {
  return yearMonthFromIndex(yearMonthIndex(clampYearMonth(raw)) + delta);
}

export function gb300Mw(racks: number, itLoadKw: number, pue: number): number {
  return (racks * itLoadKw * pue) / 1000;
}

export function phaseSite(phase: Gb300Phase): number {
  return phase.siteConstruction ?? gb300SiteConstruction(phase.rackCount);
}

export function phaseServerCapex(phase: Gb300Phase, rackPrice: number): number {
  return phase.rackCount * rackPrice;
}

export function phaseCapex(phase: Gb300Phase, rackPrice: number, hallCount: number, containerCost: number, first: boolean): number {
  const infra = (phaseSite(phase) + (first ? containerCost : 0)) * hallCount;
  return phaseServerCapex(phase, rackPrice) + infra;
}

function newPhaseId(existing: Gb300Phase[]): string {
  const used = new Set(existing.map((p) => p.id));
  for (let i = 1; i <= GB300_PHASE_MAX + 4; i++) {
    const id = `p${i}`;
    if (!used.has(id)) return id;
  }
  return `p${existing.length + 1}`;
}

export function defaultGb300Phase(rackCount = 24, goLive = DEFAULT_GB300_GO_LIVE): Gb300Phase {
  const racks = snapGb300Racks(rackCount);
  return {
    id: "p1",
    goLive: clampYearMonth(goLive),
    rackCount: racks,
  };
}

export function clampGb300Phases(sku: SkuInputs): Gb300Phase[] {
  const raw = sku.phases?.length
    ? sku.phases
    : [defaultGb300Phase(sku.rackCount ?? 24)];
  const next: Gb300Phase[] = [];
  let remaining = BOUNDS.rackCount.max;
  for (const phase of raw.slice(0, GB300_PHASE_MAX)) {
    if (remaining < GB300_RACK_BLOCK) break;
    const requested = snapGb300Racks(phase.rackCount);
    const racks = Math.min(requested, snapGb300Racks(remaining));
    remaining -= racks;
    const clamped: Gb300Phase = {
      id: phase.id?.trim() || newPhaseId(next),
      goLive: clampYearMonth(phase.goLive),
      rackCount: racks,
    };
    if (phase.siteConstruction != null && Number.isFinite(phase.siteConstruction)) {
      clamped.siteConstruction = Math.max(0, phase.siteConstruction);
    }
    next.push(clamped);
  }
  if (next.length === 0) next.push(defaultGb300Phase());
  const seen = new Set<string>();
  for (const phase of next) {
    let id = phase.id;
    while (seen.has(id)) id = newPhaseId(next.filter((p) => p.id !== phase.id));
    phase.id = id;
    seen.add(id);
  }
  return next;
}

export function gb300PhasesAreStaggered(phases: Gb300Phase[]): boolean {
  return new Set(phases.map((p) => p.goLive)).size > 1;
}

export function totalGb300Racks(phases: Gb300Phase[]): number {
  return phases.reduce((sum, p) => sum + p.rackCount, 0);
}

export function totalGb300Site(phases: Gb300Phase[]): number {
  return phases.reduce((sum, p) => sum + phaseSite(p), 0);
}

/** Keep rackCount / facility site in sync with phase cards. */
export function syncGb300Phases(inputs: ModelInputs, sku: SkuInputs = inputs.skuGb300): ModelInputs {
  const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
  const phases = clampGb300Phases(sku);
  const racks = totalGb300Racks(phases);
  return {
    ...inputs,
    skuGb300: {
      ...sku,
      gpusPerServer: GB300_GPUS_PER_RACK,
      rackCount: racks,
      phases,
    },
    gb300Facility: {
      ...f,
      siteConstruction: totalGb300Site(phases),
    },
  };
}

export function addGb300Phase(phases: Gb300Phase[]): Gb300Phase[] {
  const current = clampGb300Phases({ serverPrice: 1, bom: [], gpuRentPerHr: 1, utilization: 1, itLoadKw: 140, residualPct: 0.1, phases });
  if (current.length >= GB300_PHASE_MAX) return current;
  const used = totalGb300Racks(current);
  const leftover = BOUNDS.rackCount.max - used;
  if (leftover < GB300_RACK_BLOCK) return current;
  const last = current[current.length - 1]!;
  const added: Gb300Phase = {
    id: newPhaseId(current),
    goLive: addMonths(last.goLive, 9),
    rackCount: Math.min(GB300_RACK_BLOCK, snapGb300Racks(leftover)),
  };
  return [...current, added];
}

export function removeGb300Phase(phases: Gb300Phase[], id: string): Gb300Phase[] {
  if (phases.length <= 1) return phases;
  const firstId = phases[0]?.id;
  if (id === firstId) return phases;
  const next = phases.filter((p) => p.id !== id);
  return next.length ? next : phases;
}

export function patchGb300Phase(phases: Gb300Phase[], id: string, patch: Partial<Gb300Phase>): Gb300Phase[] {
  return phases.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p));
}
