"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOUNDS } from "@/lib/roi/defaults";
import { usd } from "@/lib/roi/format";
import { bomSum } from "@/lib/roi/sources";
import type { SkuId, SkuInputs } from "@/lib/roi/types";

import { Field, NumberInput, PercentInput } from "./fields";
import { RentSourceDialog, ServerBomDialog } from "./source-dialogs";

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

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field
        emphasis
        label="Server price"
        extra={
          <Button type="button" variant="outline" size="xs" onClick={() => setBomOpen(true)}>
            Edit BOM
          </Button>
        }
      >
        <Input
          readOnly
          className="font-mono h-8 cursor-pointer tabular-nums"
          value={usd(sku.serverPrice)}
          onClick={() => setBomOpen(true)}
          onFocus={(e) => e.currentTarget.blur()}
        />
        <ServerBomDialog
          skuId={skuId}
          lines={sku.bom}
          open={bomOpen}
          onOpenChange={setBomOpen}
          onSave={(bom) => onChange({ bom, serverPrice: bomSum(bom) })}
        />
      </Field>
      <Field
        emphasis
        label="GPU rent ($/GPU-hr)"
        extra={
          <Button type="button" variant="outline" size="xs" onClick={() => setRentOpen(true)}>
            Source
          </Button>
        }
      >
        <NumberInput
          value={sku.gpuRentPerHr}
          min={BOUNDS.gpuRentPerHr.min}
          max={BOUNDS.gpuRentPerHr.max}
          step={0.01}
          onChange={(gpuRentPerHr) => onChange({ gpuRentPerHr })}
        />
        <RentSourceDialog
          skuId={skuId}
          modelRent={sku.gpuRentPerHr}
          open={rentOpen}
          onOpenChange={setRentOpen}
        />
      </Field>
      <Field emphasis label="Utilization (%)">
        <PercentInput
          value={sku.utilization}
          min={BOUNDS.utilization.min * 100}
          max={BOUNDS.utilization.max * 100}
          step={1}
          onChange={(utilization) => onChange({ utilization })}
        />
      </Field>
    </div>
  );
}
