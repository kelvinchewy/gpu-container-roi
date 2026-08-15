"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BOUNDS } from "@/lib/roi/defaults";
import { kwh } from "@/lib/roi/format";
import type { ModelInputs, SkuId, SkuInputs } from "@/lib/roi/types";

import { AdvancedAccordion } from "./advanced-accordion";
import { Field, NumberInput, PercentInput } from "./fields";

export function ChromeBar({
  inputs,
  onChange,
  onSkuChange,
  onReset,
}: {
  inputs: ModelInputs;
  onChange: (patch: Partial<ModelInputs>) => void;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-4 border-b pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium">GPU Container ROI</h1>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="Power ($/kWh)"
          hint={`effective ${kwh(inputs.elecPerKwh * inputs.pue)}`}
        >
          <NumberInput
            value={inputs.elecPerKwh}
            min={BOUNDS.elecPerKwh.min}
            max={BOUNDS.elecPerKwh.max}
            step={0.001}
            onChange={(elecPerKwh) => onChange({ elecPerKwh })}
          />
        </Field>
        <Field label="Discount rate (NPV)">
          <PercentInput
            value={inputs.discountRate}
            min={BOUNDS.discountRate.min * 100}
            max={BOUNDS.discountRate.max * 100}
            step={0.5}
            onChange={(discountRate) => onChange({ discountRate })}
          />
        </Field>
        <Field
          label="Price decay (%/yr)"
          extra={
            <Switch
              size="sm"
              checked={inputs.priceErosionOn}
              onCheckedChange={(checked) => onChange({ priceErosionOn: Boolean(checked) })}
            />
          }
        >
          <PercentInput
            value={inputs.priceErosionRate}
            min={BOUNDS.priceErosionRate.min * 100}
            max={BOUNDS.priceErosionRate.max * 100}
            step={1}
            onChange={(priceErosionRate) => onChange({ priceErosionRate })}
          />
        </Field>
      </div>
      <AdvancedAccordion inputs={inputs} onChange={onChange} onSkuChange={onSkuChange} />
    </div>
  );
}
