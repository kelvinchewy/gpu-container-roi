"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BOUNDS, DEFAULT_GB300_FACILITY } from "@/lib/roi/defaults";
import { combinedTax } from "@/lib/roi/finance";
import { extrasSummary, pct } from "@/lib/roi/format";
import type { Gb300Facility, ModelInputs, SkuId, SkuInputs } from "@/lib/roi/types";

import { Field, MoneyInput, NumberInput, PercentInput, SwitchField, TextInput } from "./fields";
import { useT } from "./locale";

function SkuExtras({
  label,
  sku,
  onChange,
  itLabel,
  itStep = 0.1,
}: {
  label: string;
  sku: SkuInputs;
  onChange: (patch: Partial<SkuInputs>) => void;
  itLabel: string;
  itStep?: number;
}) {
  const { t } = useT();
  return (
    <div className="grid gap-3">
      <div className="text-xs font-medium">{label}</div>
      <Field label={itLabel}>
        <NumberInput
          value={sku.itLoadKw}
          min={BOUNDS.itLoadKw.min}
          max={BOUNDS.itLoadKw.max}
          step={itStep}
          onChange={(itLoadKw) => onChange({ itLoadKw })}
        />
      </Field>
      <Field label={t("residualPct")}>
        <PercentInput
          value={sku.residualPct}
          min={BOUNDS.residualPct.min * 100}
          max={BOUNDS.residualPct.max * 100}
          step={1}
          onChange={(residualPct) => onChange({ residualPct })}
        />
      </Field>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="text-xs font-medium text-muted-foreground">{children}</div>;
}

export function AdvancedAccordion({
  inputs,
  onChange,
  onSkuChange,
}: {
  inputs: ModelInputs;
  onChange: (patch: Partial<ModelInputs>) => void;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
}) {
  const tax = combinedTax(inputs.federalTax, inputs.stateTax);
  const { t, locale } = useT();

  return (
    <Accordion>
      <AccordionItem value="advanced">
        <AccordionTrigger className="hover:no-underline">
          <span className="grid gap-0.5 pr-4 text-left">
            <span>{t("siteTaxTopo")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {extrasSummary(inputs, undefined, locale)}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-6 pt-2">
            <div className="grid gap-3">
              <SectionLabel>{t("sharedAir")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("site")}>
                  <TextInput
                    value={inputs.siteName}
                    maxLength={80}
                    onChange={(siteName) => onChange({ siteName })}
                  />
                </Field>
                <Field label={t("federalTax")}>
                  <PercentInput
                    value={inputs.federalTax}
                    min={BOUNDS.federalTax.min * 100}
                    max={BOUNDS.federalTax.max * 100}
                    step={0.25}
                    onChange={(federalTax) => onChange({ federalTax })}
                  />
                </Field>
                <Field label={t("stateTax")}>
                  <PercentInput
                    value={inputs.stateTax}
                    min={BOUNDS.stateTax.min * 100}
                    max={BOUNDS.stateTax.max * 100}
                    step={0.05}
                    onChange={(stateTax) => onChange({ stateTax })}
                  />
                </Field>
                <Field label={t("propertyTaxPct")}>
                  <PercentInput
                    value={inputs.propertyTaxPctCapex}
                    min={BOUNDS.propertyTaxPctCapex.min * 100}
                    max={BOUNDS.propertyTaxPctCapex.max * 100}
                    step={0.1}
                    onChange={(propertyTaxPctCapex) => onChange({ propertyTaxPctCapex })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SwitchField
                  label={t("obbba")}
                  checked={inputs.obbbaEnabled}
                  onCheckedChange={(checked) => onChange({ obbbaEnabled: Boolean(checked) })}
                />
                <Badge variant="secondary" className="font-mono">
                  {t("combinedTax", { value: pct(tax, 4) })}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("topoAir")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("containers")}>
                  <NumberInput
                    value={inputs.containerCount}
                    min={BOUNDS.containerCount.min}
                    max={BOUNDS.containerCount.max}
                    step={1}
                    onChange={(containerCount) => onChange({ containerCount })}
                  />
                </Field>
                <Field label={t("serversPerContainer")}>
                  <NumberInput
                    value={inputs.serversPerContainer}
                    min={BOUNDS.serversPerContainer.min}
                    max={BOUNDS.serversPerContainer.max}
                    step={1}
                    onChange={(serversPerContainer) => onChange({ serversPerContainer })}
                  />
                </Field>
                <Field label={t("gpusPerServer")}>
                  <NumberInput
                    value={inputs.gpusPerServer}
                    min={BOUNDS.gpusPerServer.min}
                    max={BOUNDS.gpusPerServer.max}
                    step={1}
                    onChange={(gpusPerServer) => onChange({ gpusPerServer })}
                  />
                </Field>
                <Field label={t("pue")}>
                  <NumberInput
                    value={inputs.pue}
                    min={BOUNDS.pue.min}
                    max={BOUNDS.pue.max}
                    step={0.01}
                    onChange={(pue) => onChange({ pue })}
                  />
                </Field>
                <Field label={t("hoursPerYear")}>
                  <NumberInput
                    value={inputs.hoursPerYear}
                    min={BOUNDS.hoursPerYear.min}
                    max={BOUNDS.hoursPerYear.max}
                    step={1}
                    onChange={(hoursPerYear) => onChange({ hoursPerYear })}
                  />
                </Field>
                <Field label={t("usefulLife")}>
                  <NumberInput
                    value={inputs.usefulLifeYrs}
                    min={BOUNDS.usefulLifeYrs.min}
                    max={BOUNDS.usefulLifeYrs.max}
                    step={1}
                    onChange={(usefulLifeYrs) => onChange({ usefulLifeYrs })}
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("perGpu")}</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <SkuExtras
                  label="RTX 5090"
                  sku={inputs.sku5090}
                  onChange={(patch) => onSkuChange("5090", patch)}
                  itLabel={t("itLoadServer")}
                />
                <SkuExtras
                  label="Pro 6000"
                  sku={inputs.skuPro6000}
                  onChange={(patch) => onSkuChange("pro6000", patch)}
                  itLabel={t("itLoadServer")}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("capexOpexAir")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("containerCost")}>
                  <MoneyInput
                    value={inputs.containerCost}
                    min={0}
                    onChange={(containerCost) => onChange({ containerCost })}
                  />
                </Field>
                <Field label={t("siteConstruction")}>
                  <MoneyInput
                    value={inputs.siteConstruction}
                    min={0}
                    onChange={(siteConstruction) => onChange({ siteConstruction })}
                  />
                </Field>
                <Field label={t("networkOpex")}>
                  <NumberInput
                    value={inputs.networkOpexMo}
                    min={0}
                    step={50}
                    onChange={(networkOpexMo) => onChange({ networkOpexMo })}
                  />
                </Field>
                <Field label={t("omOpex")}>
                  <NumberInput
                    value={inputs.omOpexMo}
                    min={0}
                    step={50}
                    onChange={(omOpexMo) => onChange({ omOpexMo })}
                  />
                </Field>
                <Field label={t("insurancePct")}>
                  <PercentInput
                    value={inputs.insurancePctRev}
                    min={BOUNDS.insurancePctRev.min * 100}
                    max={BOUNDS.insurancePctRev.max * 100}
                    step={0.1}
                    onChange={(insurancePctRev) => onChange({ insurancePctRev })}
                  />
                </Field>
                <Field label={t("otherOpexPct")}>
                  <PercentInput
                    value={inputs.otherOpexPctRev}
                    min={BOUNDS.otherOpexPctRev.min * 100}
                    max={BOUNDS.otherOpexPctRev.max * 100}
                    step={0.1}
                    onChange={(otherOpexPctRev) => onChange({ otherOpexPctRev })}
                  />
                </Field>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function Gb300Accordion({
  inputs,
  onFacilityChange,
  onSkuChange,
}: {
  inputs: ModelInputs;
  onFacilityChange: (patch: Partial<Gb300Facility>) => void;
  onSkuChange: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
}) {
  const f = inputs.gb300Facility ?? DEFAULT_GB300_FACILITY;
  const tax = combinedTax(f.federalTax, f.stateTax);
  const { t, locale } = useT();

  return (
    <Accordion>
      <AccordionItem value="gb300-facility">
        <AccordionTrigger className="hover:no-underline">
          <span className="grid gap-0.5 pr-4 text-left">
            <span>{t("siteTaxTopo")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {extrasSummary(inputs, "gb300", locale)}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-6 pt-2">
            <div className="grid gap-3">
              <SectionLabel>{t("siteTaxGb300")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("site")}>
                  <TextInput
                    value={f.siteName}
                    maxLength={80}
                    onChange={(siteName) => onFacilityChange({ siteName })}
                  />
                </Field>
                <Field label={t("federalTax")}>
                  <PercentInput
                    value={f.federalTax}
                    min={BOUNDS.federalTax.min * 100}
                    max={BOUNDS.federalTax.max * 100}
                    step={0.25}
                    onChange={(federalTax) => onFacilityChange({ federalTax })}
                  />
                </Field>
                <Field label={t("stateTax")}>
                  <PercentInput
                    value={f.stateTax}
                    min={BOUNDS.stateTax.min * 100}
                    max={BOUNDS.stateTax.max * 100}
                    step={0.05}
                    onChange={(stateTax) => onFacilityChange({ stateTax })}
                  />
                </Field>
                <Field label={t("propertyTaxPct")}>
                  <PercentInput
                    value={f.propertyTaxPctCapex}
                    min={BOUNDS.propertyTaxPctCapex.min * 100}
                    max={BOUNDS.propertyTaxPctCapex.max * 100}
                    step={0.1}
                    onChange={(propertyTaxPctCapex) => onFacilityChange({ propertyTaxPctCapex })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SwitchField
                  label={t("obbba")}
                  checked={f.obbbaEnabled}
                  onCheckedChange={(checked) =>
                    onFacilityChange({ obbbaEnabled: Boolean(checked) })
                  }
                />
                <Badge variant="secondary" className="font-mono">
                  {t("combinedTax", { value: pct(tax, 4) })}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("topoNvl72")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("halls")}>
                  <NumberInput
                    value={f.hallCount}
                    min={BOUNDS.hallCount.min}
                    max={BOUNDS.hallCount.max}
                    step={1}
                    onChange={(hallCount) => onFacilityChange({ hallCount })}
                  />
                </Field>
                <Field label={t("pue")}>
                  <NumberInput
                    value={f.pue}
                    min={BOUNDS.pue.min}
                    max={BOUNDS.pue.max}
                    step={0.01}
                    onChange={(pue) => onFacilityChange({ pue })}
                  />
                </Field>
                <Field label={t("hoursPerYear")}>
                  <NumberInput
                    value={f.hoursPerYear}
                    min={BOUNDS.hoursPerYear.min}
                    max={BOUNDS.hoursPerYear.max}
                    step={1}
                    onChange={(hoursPerYear) => onFacilityChange({ hoursPerYear })}
                  />
                </Field>
                <Field label={t("usefulLife")}>
                  <NumberInput
                    value={f.usefulLifeYrs}
                    min={BOUNDS.gb300UsefulLifeYrs.min}
                    max={BOUNDS.gb300UsefulLifeYrs.max}
                    step={1}
                    onChange={(usefulLifeYrs) => onFacilityChange({ usefulLifeYrs })}
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("perRack")}</SectionLabel>
              <SkuExtras
                label="GB300 NVL72"
                sku={inputs.skuGb300}
                onChange={(patch) => onSkuChange("gb300", patch)}
                itLabel={t("itLoadRack")}
                itStep={1}
              />
            </div>

            <div className="grid gap-3">
              <SectionLabel>{t("capexOpexGb300")}</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={t("containerCost")}>
                  <MoneyInput
                    value={f.containerCost}
                    min={0}
                    onChange={(containerCost) => onFacilityChange({ containerCost })}
                  />
                </Field>
                <Field label={t("siteConstruction")}>
                  <MoneyInput
                    value={f.siteConstruction}
                    min={0}
                    onChange={(siteConstruction) => onFacilityChange({ siteConstruction })}
                  />
                </Field>
                <Field label={t("networkOpex")}>
                  <NumberInput
                    value={f.networkOpexMo}
                    min={0}
                    step={50}
                    onChange={(networkOpexMo) => onFacilityChange({ networkOpexMo })}
                  />
                </Field>
                <Field label={t("omOpex")}>
                  <NumberInput
                    value={f.omOpexMo}
                    min={0}
                    step={50}
                    onChange={(omOpexMo) => onFacilityChange({ omOpexMo })}
                  />
                </Field>
                <Field label={t("insurancePct")}>
                  <PercentInput
                    value={f.insurancePctRev}
                    min={BOUNDS.insurancePctRev.min * 100}
                    max={BOUNDS.insurancePctRev.max * 100}
                    step={0.1}
                    onChange={(insurancePctRev) => onFacilityChange({ insurancePctRev })}
                  />
                </Field>
                <Field label={t("otherOpexPct")}>
                  <PercentInput
                    value={f.otherOpexPctRev}
                    min={BOUNDS.otherOpexPctRev.min * 100}
                    max={BOUNDS.otherOpexPctRev.max * 100}
                    step={0.1}
                    onChange={(otherOpexPctRev) => onFacilityChange({ otherOpexPctRev })}
                  />
                </Field>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
