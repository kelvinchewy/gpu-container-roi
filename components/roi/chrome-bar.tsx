"use client";

import { Switch } from "@/components/ui/switch";
import { BOUNDS, DEFAULT_GB300_FACILITY } from "@/lib/roi/defaults";
import { kwh } from "@/lib/roi/format";
import type { Gb300Facility, ModelInputs, SkuId, SkuInputs, TabId } from "@/lib/roi/types";
import { cn } from "@/lib/utils";

import { AdvancedAccordion, Gb300Accordion } from "./advanced-accordion";
import { Field, FieldRow, NumberInput, PercentInput } from "./fields";
import { useT } from "./locale";

export function ChromeBar({
  tab,
  inputs,
  onChange,
  onSkuChange,
  onFacilityChange,
}: {
  tab: TabId;
  inputs: ModelInputs;
  onChange: (patch: Partial<ModelInputs>) => void;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
  onFacilityChange: (patch: Partial<Gb300Facility>) => void;
}) {
  const gb300 = tab === "gb300";
  const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
  const power = gb300 ? f.elecPerKwh : inputs.elecPerKwh;
  const pue = gb300 ? f.pue : inputs.pue;
  const { t } = useT();

  return (
    <div
      className={cn(
        "grid gap-4 rounded-lg p-4",
        gb300 ? "bg-primary/5" : "bg-muted/30",
      )}
    >
      <FieldRow className="md:grid-cols-3">
        <Field
          emphasis
          label={t("power")}
          hint={t("effective", { value: kwh(power * pue) })}
        >
          <NumberInput
            value={power}
            min={BOUNDS.elecPerKwh.min}
            max={BOUNDS.elecPerKwh.max}
            step={0.001}
            onChange={(elecPerKwh) =>
              gb300 ? onFacilityChange({ elecPerKwh }) : onChange({ elecPerKwh })
            }
          />
        </Field>
        <Field emphasis label={t("discount")}>
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
          label={t("priceDecay")}
          extra={
            <Switch
              size="sm"
              checked={inputs.priceErosionOn}
              aria-label={t("applyDecay")}
              onCheckedChange={(checked) => onChange({ priceErosionOn: Boolean(checked) })}
            />
          }
        >
          {inputs.priceErosionOn ? (
            <PercentInput
              value={inputs.priceErosionRate}
              min={BOUNDS.priceErosionRate.min * 100}
              max={BOUNDS.priceErosionRate.max * 100}
              step={1}
              onChange={(priceErosionRate) => onChange({ priceErosionRate })}
            />
          ) : (
            <span className="sr-only">{t("decayOff")}</span>
          )}
        </Field>
      </FieldRow>
      {gb300 ? (
        <Gb300Accordion
          inputs={inputs}
          onFacilityChange={onFacilityChange}
          onSkuChange={onSkuChange}
        />
      ) : (
        <AdvancedAccordion inputs={inputs} onChange={onChange} onSkuChange={onSkuChange} />
      )}
    </div>
  );
}
