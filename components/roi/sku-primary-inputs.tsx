"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BOUNDS, DEFAULT_GB300_FACILITY, GB300_GPUS_PER_RACK } from "@/lib/roi/defaults";
import { usd } from "@/lib/roi/format";
import {
  addGb300Phase,
  clampGb300Phases,
  GB300_GO_LIVE_MAX,
  GB300_GO_LIVE_MIN,
  GB300_PHASE_MAX,
  gb300Mw,
  phaseCapex,
  phaseSite,
  removeGb300Phase,
  patchGb300Phase,
  totalGb300Racks,
} from "@/lib/roi/phases";
import { bomSum, syncBomToPrice } from "@/lib/roi/sources";
import type { Gb300Facility, SkuId, SkuInputs } from "@/lib/roi/types";

import { Field, FieldRow, MoneyInput, MonthInput, NumberInput, PercentInput, useFieldId } from "./fields";
import { useT } from "./locale";
import { RentSourceDialog, ServerBomDialog } from "./source-dialogs";

function ServerPriceButton({ price, onOpen }: { price: number; onOpen: () => void }) {
  const id = useFieldId();
  return (
    <Button
      id={id}
      type="button"
      variant="outline"
      aria-haspopup="dialog"
      className="h-8 w-full justify-start font-mono tabular-nums"
      onClick={onOpen}
    >
      {usd(price)}
    </Button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="text-xs font-medium text-muted-foreground">{children}</div>;
}

export function SkuPrimaryInputs({
  skuId,
  sku,
  facility,
  onChange,
}: {
  skuId: SkuId;
  sku: SkuInputs;
  facility?: Gb300Facility;
  onChange: (patch: Partial<SkuInputs>) => void;
}) {
  const [bomOpen, setBomOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const { t } = useT();
  const isRack = skuId === "gb300";
  const gpus = GB300_GPUS_PER_RACK;
  const f = facility ?? DEFAULT_GB300_FACILITY;
  const phases = clampGb300Phases(sku);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <SectionLabel>{isRack ? t("soldUnit") : t("server")}</SectionLabel>
        {isRack ? (
          <div className="grid gap-4">
            <Field emphasis label={t("rackPrice")}>
              <MoneyInput
                value={sku.serverPrice}
                min={0.01}
                onChange={(serverPrice) =>
                  onChange({
                    serverPrice,
                    bom: syncBomToPrice(sku.bom, serverPrice),
                  })
                }
              />
            </Field>
            {phases.map((phase, i) => {
              const first = i === 0;
              const mw = gb300Mw(phase.rackCount, sku.itLoadKw, f.pue);
              const capex = phaseCapex(phase, sku.serverPrice, f.hallCount, f.containerCost, first);
              return (
                <div key={phase.id} className="grid gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    <div className="text-xs font-medium">{t("phase", { n: i + 1 })}</div>
                    {!first && phases.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => onChange({ phases: removeGb300Phase(phases, phase.id) })}
                      >
                        {t("removePhase")}
                      </Button>
                    ) : null}
                  </div>
                  <FieldRow className="sm:grid-cols-3">
                    <Field emphasis label={t("goLive")}>
                      <MonthInput
                        value={phase.goLive}
                        min={GB300_GO_LIVE_MIN}
                        max={GB300_GO_LIVE_MAX}
                        onChange={(goLive) =>
                          onChange({ phases: patchGb300Phase(phases, phase.id, { goLive }) })
                        }
                      />
                    </Field>
                    <Field emphasis label={t("racks")}>
                      <NumberInput
                        value={phase.rackCount}
                        min={BOUNDS.rackCount.min}
                        max={BOUNDS.rackCount.max}
                        step={6}
                        onChange={(rackCount) =>
                          onChange({
                            phases: patchGb300Phase(phases, phase.id, {
                              rackCount,
                              siteConstruction: undefined,
                            }),
                          })
                        }
                      />
                    </Field>
                    <Field emphasis label={t("gpusPerRack")} caption={t("nvl72Fixed")}>
                      <NumberInput value={gpus} disabled />
                    </Field>
                  </FieldRow>
                  <FieldRow className="sm:grid-cols-3">
                    <Field label={t("phaseMw")} caption={`PUE ${f.pue.toFixed(2)}`}>
                      <NumberInput value={Number(mw.toFixed(2))} disabled />
                    </Field>
                    <Field label={t("siteConstruction")} caption={t("sitePerMwBlock")}>
                      <MoneyInput
                        value={phaseSite(phase)}
                        min={0}
                        onChange={(siteConstruction) =>
                          onChange({
                            phases: patchGb300Phase(phases, phase.id, { siteConstruction }),
                          })
                        }
                      />
                    </Field>
                    <Field label={t("phaseCapex")}>
                      <MoneyInput value={capex} disabled />
                    </Field>
                  </FieldRow>
                </div>
              );
            })}
            <Button
              type="button"
              size="sm"
              disabled={
                phases.length >= GB300_PHASE_MAX ||
                totalGb300Racks(phases) > BOUNDS.rackCount.max - 6
              }
              onClick={() => onChange({ phases: addGb300Phase(phases) })}
            >
              {t("addPhase")}
            </Button>
          </div>
        ) : (
          <Field
            emphasis
            label={t("serverPrice")}
            extra={
              <Button type="button" variant="outline" size="xs" onClick={() => setBomOpen(true)}>
                {t("editBom")}
              </Button>
            }
          >
            <ServerPriceButton price={sku.serverPrice} onOpen={() => setBomOpen(true)} />
            <ServerBomDialog
              skuId={skuId}
              lines={sku.bom}
              open={bomOpen}
              onOpenChange={setBomOpen}
              onSave={(bom) => onChange({ bom, serverPrice: bomSum(bom) })}
            />
          </Field>
        )}
      </div>

      <div className="grid gap-3">
        <SectionLabel>{t("rent")}</SectionLabel>
        <FieldRow className={isRack ? "sm:grid-cols-3" : "sm:grid-cols-2"}>
          <Field
            emphasis
            label={isRack ? t("serverRent") : t("gpuRent")}
            caption={
              isRack && gpus > 0
                ? t("impliedGpuHr", { value: (sku.gpuRentPerHr / gpus).toFixed(2) })
                : undefined
            }
            extra={
              isRack ? undefined : (
                <Button type="button" variant="outline" size="xs" onClick={() => setRentOpen(true)}>
                  {t("source")}
                </Button>
              )
            }
          >
            <NumberInput
              value={sku.gpuRentPerHr}
              min={isRack ? BOUNDS.gb300RentPerHr.min : BOUNDS.gpuRentPerHr.min}
              max={isRack ? BOUNDS.gb300RentPerHr.max : BOUNDS.gpuRentPerHr.max}
              step={0.01}
              onChange={(gpuRentPerHr) => onChange({ gpuRentPerHr })}
            />
            {isRack ? null : (
              <RentSourceDialog
                skuId={skuId}
                modelRent={sku.gpuRentPerHr}
                open={rentOpen}
                onOpenChange={setRentOpen}
              />
            )}
          </Field>
          <Field emphasis label={t("utilization")}>
            <PercentInput
              value={sku.utilization}
              min={BOUNDS.utilization.min * 100}
              max={BOUNDS.utilization.max * 100}
              step={1}
              onChange={(utilization) => onChange({ utilization })}
            />
          </Field>
        </FieldRow>
      </div>
    </div>
  );
}
