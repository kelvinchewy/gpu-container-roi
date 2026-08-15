"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BOUNDS } from "@/lib/roi/defaults";
import { combinedTax } from "@/lib/roi/finance";
import { extrasSummary, pct } from "@/lib/roi/format";
import type { ModelInputs, SkuId, SkuInputs } from "@/lib/roi/types";

import { Field, NumberInput, PercentInput, SwitchField } from "./fields";

function SkuExtras({
  label,
  sku,
  onChange,
}: {
  label: string;
  sku: SkuInputs;
  onChange: (patch: Partial<SkuInputs>) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="text-xs font-medium">{label}</div>
      <Field label="IT load (kW/server)">
        <NumberInput
          value={sku.itLoadKw}
          min={BOUNDS.itLoadKw.min}
          max={BOUNDS.itLoadKw.max}
          step={0.1}
          onChange={(itLoadKw) => onChange({ itLoadKw })}
        />
      </Field>
      <Field label="Residual %">
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

  return (
    <Accordion>
      <AccordionItem value="advanced">
        <AccordionTrigger className="hover:no-underline">
          <span className="grid gap-0.5 pr-4 text-left">
            <span>Site, tax, topology</span>
            <span className="text-sm font-normal text-muted-foreground">
              {extrasSummary(inputs)}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-6 pt-2">
            <div className="grid gap-3">
              <SectionLabel>Shared</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Site">
                  <Input
                    className="h-8"
                    value={inputs.siteName}
                    onChange={(e) => onChange({ siteName: e.target.value })}
                  />
                </Field>
                <Field label="Federal tax">
                  <PercentInput
                    value={inputs.federalTax}
                    min={BOUNDS.federalTax.min * 100}
                    max={BOUNDS.federalTax.max * 100}
                    step={0.25}
                    onChange={(federalTax) => onChange({ federalTax })}
                  />
                </Field>
                <Field label="State tax">
                  <PercentInput
                    value={inputs.stateTax}
                    min={BOUNDS.stateTax.min * 100}
                    max={BOUNDS.stateTax.max * 100}
                    step={0.05}
                    onChange={(stateTax) => onChange({ stateTax })}
                  />
                </Field>
                <Field label="Property tax (% of capex)">
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
                  label="OBBBA (100% Y1 bonus)"
                  checked={inputs.obbbaEnabled}
                  onCheckedChange={(checked) => onChange({ obbbaEnabled: Boolean(checked) })}
                />
                <Badge variant="secondary" className="font-mono">
                  Combined tax {pct(tax, 4)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>Topology (shared)</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Containers">
                  <NumberInput
                    value={inputs.containerCount}
                    min={BOUNDS.containerCount.min}
                    max={BOUNDS.containerCount.max}
                    step={1}
                    onChange={(containerCount) => onChange({ containerCount })}
                  />
                </Field>
                <Field label="Servers / container">
                  <NumberInput
                    value={inputs.serversPerContainer}
                    min={BOUNDS.serversPerContainer.min}
                    max={BOUNDS.serversPerContainer.max}
                    step={1}
                    onChange={(serversPerContainer) => onChange({ serversPerContainer })}
                  />
                </Field>
                <Field label="GPUs / server">
                  <NumberInput
                    value={inputs.gpusPerServer}
                    min={BOUNDS.gpusPerServer.min}
                    max={BOUNDS.gpusPerServer.max}
                    step={1}
                    onChange={(gpusPerServer) => onChange({ gpusPerServer })}
                  />
                </Field>
                <Field label="PUE">
                  <NumberInput
                    value={inputs.pue}
                    min={BOUNDS.pue.min}
                    max={BOUNDS.pue.max}
                    step={0.01}
                    onChange={(pue) => onChange({ pue })}
                  />
                </Field>
                <Field label="Hours / year">
                  <NumberInput
                    value={inputs.hoursPerYear}
                    min={BOUNDS.hoursPerYear.min}
                    max={BOUNDS.hoursPerYear.max}
                    step={1}
                    onChange={(hoursPerYear) => onChange({ hoursPerYear })}
                  />
                </Field>
                <Field label="Useful life (yrs)">
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
              <SectionLabel>Per GPU</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <SkuExtras
                  label="RTX 5090"
                  sku={inputs.sku5090}
                  onChange={(patch) => onSkuChange("5090", patch)}
                />
                <SkuExtras
                  label="Pro 6000"
                  sku={inputs.skuPro6000}
                  onChange={(patch) => onSkuChange("pro6000", patch)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <SectionLabel>Capex and opex rates (shared)</SectionLabel>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Container cost">
                  <NumberInput
                    value={inputs.containerCost}
                    min={0}
                    step={1000}
                    onChange={(containerCost) => onChange({ containerCost })}
                  />
                </Field>
                <Field label="Site construction">
                  <NumberInput
                    value={inputs.siteConstruction}
                    min={0}
                    step={1000}
                    onChange={(siteConstruction) => onChange({ siteConstruction })}
                  />
                </Field>
                <Field label="Network opex ($/mo)">
                  <NumberInput
                    value={inputs.networkOpexMo}
                    min={0}
                    step={50}
                    onChange={(networkOpexMo) => onChange({ networkOpexMo })}
                  />
                </Field>
                <Field label="O&M opex ($/mo)">
                  <NumberInput
                    value={inputs.omOpexMo}
                    min={0}
                    step={50}
                    onChange={(omOpexMo) => onChange({ omOpexMo })}
                  />
                </Field>
                <Field label="Insurance (% of rev)">
                  <PercentInput
                    value={inputs.insurancePctRev}
                    min={BOUNDS.insurancePctRev.min * 100}
                    max={BOUNDS.insurancePctRev.max * 100}
                    step={0.1}
                    onChange={(insurancePctRev) => onChange({ insurancePctRev })}
                  />
                </Field>
                <Field label="Other opex (% of rev)">
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
