"use client";

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
}: {
  inputs: ModelInputs;
  onChange: (patch: Partial<ModelInputs>) => void;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          emphasis
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
        <Field emphasis label="Discount rate (NPV)">
          <PercentInput
            value={inputs.discountRate}
            min={BOUNDS.discountRate.min * 100}
            max={BOUNDS.discountRate.max * 100}
            step={0.5}
            onChange={(discountRate) => onChange({ discountRate })}
          />
        </Field>
        <Field
          emphasis
          label="Price decay (%/yr)"
          extra={
            <Switch
              size="sm"
              checked={inputs.priceErosionOn}
              aria-label="Apply price decay"
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
