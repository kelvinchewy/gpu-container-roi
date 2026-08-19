"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BOUNDS } from "@/lib/roi/defaults";
import { usd } from "@/lib/roi/format";
import { bomSum, syncBomToPrice } from "@/lib/roi/sources";
import type { SkuId, SkuInputs } from "@/lib/roi/types";

import { Field, FieldRow, MoneyInput, NumberInput, PercentInput, useFieldId } from "./fields";
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
  onChange,
}: {
  skuId: SkuId;
  sku: SkuInputs;
  onChange: (patch: Partial<SkuInputs>) => void;
}) {
  const [bomOpen, setBomOpen] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const { t } = useT();
  const isRack = skuId === "gb300";
  const gpus = sku.gpusPerServer ?? 72;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <SectionLabel>{isRack ? t("soldUnit") : t("server")}</SectionLabel>
        {isRack ? (
          <FieldRow className="sm:grid-cols-3">
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
            <Field emphasis label={t("racks")}>
              <NumberInput
                value={sku.rackCount ?? 24}
                min={BOUNDS.rackCount.min}
                max={BOUNDS.rackCount.max}
                step={1}
                onChange={(rackCount) => onChange({ rackCount })}
              />
            </Field>
            <Field emphasis label={t("gpusPerRack")}>
              <NumberInput
                value={gpus}
                min={BOUNDS.rackGpus.min}
                max={BOUNDS.rackGpus.max}
                step={1}
                onChange={(gpusPerServer) => onChange({ gpusPerServer })}
              />
            </Field>
          </FieldRow>
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
