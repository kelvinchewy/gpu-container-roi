"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  chartCaption,
  monthLabel,
  multiple,
  pct,
  usd,
  usdParenK,
  years,
} from "@/lib/roi/format";
import type { ModelInputs, SkuResult } from "@/lib/roi/types";
import type { Locale } from "@/lib/roi/i18n";
import { cn } from "@/lib/utils";

import { CumulativeChart } from "./cumulative-chart";
import { useT } from "./locale";

type MetricRow = {
  metric: string;
  a: string;
  b: string;
  delta: string;
  deltaValue: number | null;
  higherIsBetter: boolean;
};

function deltaClass(value: number | null, higherIsBetter: boolean): string {
  if (value == null || Math.abs(value) < 1e-12) return "text-muted-foreground";
  const proBetter = higherIsBetter ? value > 0 : value < 0;
  return proBetter ? "text-gain" : "text-destructive";
}

function HeadTip({ label, tip }: { label: string; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help text-inherit underline decoration-dotted underline-offset-4">
        {label}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function TaxMetricHeads() {
  const { t } = useT();
  return (
    <>
      <TableHead className="text-right">
        <HeadTip label={t("yearlyDep")} tip={t("taxDepTip")} />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip label={t("yearlyEbit")} tip={t("taxEbitTip")} />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip label={t("yearlyTax")} tip={t("taxCashTip")} />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip label={t("yearlyNol")} tip={t("taxNolTip")} />
      </TableHead>
    </>
  );
}

function TaxSplitHead() {
  return (
    <TableHead rowSpan={2} aria-hidden className="relative h-auto w-4 min-w-4 p-0">
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
    </TableHead>
  );
}

function TaxSplitCell() {
  return (
    <TableCell aria-hidden className="relative w-4 min-w-4 p-0">
      <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
    </TableCell>
  );
}

function TaxSkuCells({
  depreciation,
  ebit,
  tax,
  nol,
}: {
  depreciation: number;
  ebit: number;
  tax: number;
  nol: number;
}) {
  return (
    <>
      <TableCell className="text-right font-mono">{usdParenK(depreciation)}</TableCell>
      <TableCell className="text-right font-mono">{usdParenK(ebit)}</TableCell>
      <TableCell className="text-right font-mono">{usdParenK(tax)}</TableCell>
      <TableCell className="text-right font-mono">{nol ? usdParenK(nol) : "—"}</TableCell>
    </>
  );
}

function signedUsd(value: number): string {
  const abs = usd(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `−${abs}`;
  return abs;
}

function signedYears(value: number | null, other: number | null, locale: Locale): string {
  if (value == null || other == null) return "—";
  const d = value - other;
  const abs = years(Math.abs(d), 2, locale);
  if (d > 0) return `+${abs}`;
  if (d < 0) return `−${abs}`;
  return abs;
}

function signedPctPts(a: number | null, b: number | null): string {
  if (a == null || b == null) return "—";
  const d = (a - b) * 100;
  const abs = `${Math.abs(d).toFixed(2)} pp`;
  if (d > 0) return `+${abs}`;
  if (d < 0) return `−${abs}`;
  return abs;
}

function signedMonth(a: number | null, b: number | null): string {
  if (a == null || b == null) return "—";
  const d = a - b;
  if (d > 0) return `+${d}`;
  if (d < 0) return `−${Math.abs(d)}`;
  return "0";
}

function signedMultiple(a: number, b: number): string {
  const d = a - b;
  const abs = `${Math.abs(d).toFixed(2)}x`;
  if (d > 0) return `+${abs}`;
  if (d < 0) return `−${abs}`;
  return abs;
}

function irrLabel(value: number | null): string {
  return value == null ? "—" : pct(value, 2);
}

function MetricTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: MetricRow[];
}) {
  const { t } = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("metric")}</TableHead>
              <TableHead className="text-right">RTX 5090</TableHead>
              <TableHead className="text-right">Pro 6000</TableHead>
              <TableHead className="text-right">
                <HeadTip label={t("delta")} tip={t("deltaTip")} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.metric}>
                <TableCell>{row.metric}</TableCell>
                <TableCell className="text-right font-mono">{row.a}</TableCell>
                <TableCell className="text-right font-mono">{row.b}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    deltaClass(row.deltaValue, row.higherIsBetter),
                  )}
                >
                  {row.delta}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function CompareTab({
  inputs,
  sku5090,
  skuPro6000,
}: {
  inputs: ModelInputs;
  sku5090: SkuResult;
  skuPro6000: SkuResult;
}) {
  const { t, locale } = useT();
  const caption = chartCaption(inputs, "5090 vs Pro 6000", undefined, locale);
  const obbba = t(inputs.obbbaEnabled ? "obbbaOn" : "obbbaOff");

  const kpiRows: MetricRow[] = [
    {
      metric: t("capex"),
      a: usd(sku5090.totalCapex),
      b: usd(skuPro6000.totalCapex),
      delta: signedUsd(skuPro6000.totalCapex - sku5090.totalCapex),
      deltaValue: skuPro6000.totalCapex - sku5090.totalCapex,
      higherIsBetter: false,
    },
    {
      metric: t("y1Ncf"),
      a: usd(sku5090.y1Ncf),
      b: usd(skuPro6000.y1Ncf),
      delta: signedUsd(skuPro6000.y1Ncf - sku5090.y1Ncf),
      deltaValue: skuPro6000.y1Ncf - sku5090.y1Ncf,
      higherIsBetter: true,
    },
    {
      metric: t("payback"),
      a: years(sku5090.paybackYears, 2, locale),
      b: years(skuPro6000.paybackYears, 2, locale),
      delta: signedYears(skuPro6000.paybackYears, sku5090.paybackYears, locale),
      deltaValue:
        skuPro6000.paybackYears == null || sku5090.paybackYears == null
          ? null
          : skuPro6000.paybackYears - sku5090.paybackYears,
      higherIsBetter: false,
    },
    {
      metric: t("irr"),
      a: irrLabel(sku5090.irr),
      b: irrLabel(skuPro6000.irr),
      delta: signedPctPts(skuPro6000.irr, sku5090.irr),
      deltaValue:
        skuPro6000.irr == null || sku5090.irr == null
          ? null
          : skuPro6000.irr - sku5090.irr,
      higherIsBetter: true,
    },
    {
      metric: t("npv"),
      a: usd(sku5090.npv),
      b: usd(skuPro6000.npv),
      delta: signedUsd(skuPro6000.npv - sku5090.npv),
      deltaValue: skuPro6000.npv - sku5090.npv,
      higherIsBetter: true,
    },
    {
      metric: t("residualYn", { n: sku5090.years.length }),
      a: usd(sku5090.residualCash),
      b: usd(skuPro6000.residualCash),
      delta: signedUsd(skuPro6000.residualCash - sku5090.residualCash),
      deltaValue: skuPro6000.residualCash - sku5090.residualCash,
      higherIsBetter: true,
    },
    {
      metric: t("breakevenMonth"),
      a: monthLabel(sku5090.breakevenMonth),
      b: monthLabel(skuPro6000.breakevenMonth),
      delta: signedMonth(skuPro6000.breakevenMonth, sku5090.breakevenMonth),
      deltaValue:
        skuPro6000.breakevenMonth == null || sku5090.breakevenMonth == null
          ? null
          : skuPro6000.breakevenMonth - sku5090.breakevenMonth,
      higherIsBetter: false,
    },
  ];

  const returnRows: MetricRow[] = [
    {
      metric: t("cashOnCash"),
      a: pct(sku5090.cashOnCash, 2),
      b: pct(skuPro6000.cashOnCash, 2),
      delta: signedPctPts(skuPro6000.cashOnCash, sku5090.cashOnCash),
      deltaValue: skuPro6000.cashOnCash - sku5090.cashOnCash,
      higherIsBetter: true,
    },
    {
      metric: t("totalRoi"),
      a: pct(sku5090.totalRoi, 2),
      b: pct(skuPro6000.totalRoi, 2),
      delta: signedPctPts(skuPro6000.totalRoi, sku5090.totalRoi),
      deltaValue: skuPro6000.totalRoi - sku5090.totalRoi,
      higherIsBetter: true,
    },
    {
      metric: t("moic"),
      a: multiple(sku5090.moic),
      b: multiple(skuPro6000.moic),
      delta: signedMultiple(skuPro6000.moic, sku5090.moic),
      deltaValue: skuPro6000.moic - sku5090.moic,
      higherIsBetter: true,
    },
  ];

  const unitRows: MetricRow[] = [
    {
      metric: t("revenuePerGpu"),
      a: usd(sku5090.revenuePerGpu),
      b: usd(skuPro6000.revenuePerGpu),
      delta: signedUsd(skuPro6000.revenuePerGpu - sku5090.revenuePerGpu),
      deltaValue: skuPro6000.revenuePerGpu - sku5090.revenuePerGpu,
      higherIsBetter: true,
    },
    {
      metric: t("opexPerGpu"),
      a: usd(sku5090.opexPerGpu),
      b: usd(skuPro6000.opexPerGpu),
      delta: signedUsd(skuPro6000.opexPerGpu - sku5090.opexPerGpu),
      deltaValue: skuPro6000.opexPerGpu - sku5090.opexPerGpu,
      higherIsBetter: false,
    },
    {
      metric: t("ncfPerGpu"),
      a: usd(sku5090.ncfPerGpu),
      b: usd(skuPro6000.ncfPerGpu),
      delta: signedUsd(skuPro6000.ncfPerGpu - sku5090.ncfPerGpu),
      deltaValue: skuPro6000.ncfPerGpu - sku5090.ncfPerGpu,
      higherIsBetter: true,
    },
    {
      metric: t("capexPerGpu"),
      a: usd(sku5090.capexPerGpu),
      b: usd(skuPro6000.capexPerGpu),
      delta: signedUsd(skuPro6000.capexPerGpu - sku5090.capexPerGpu),
      deltaValue: skuPro6000.capexPerGpu - sku5090.capexPerGpu,
      higherIsBetter: false,
    },
    {
      metric: t("revenuePerKw"),
      a: usd(sku5090.revenuePerKw),
      b: usd(skuPro6000.revenuePerKw),
      delta: signedUsd(skuPro6000.revenuePerKw - sku5090.revenuePerKw),
      deltaValue: skuPro6000.revenuePerKw - sku5090.revenuePerKw,
      higherIsBetter: true,
    },
    {
      metric: t("ncfPerKw"),
      a: usd(sku5090.ncfPerKw),
      b: usd(skuPro6000.ncfPerKw),
      delta: signedUsd(skuPro6000.ncfPerKw - sku5090.ncfPerKw),
      deltaValue: skuPro6000.ncfPerKw - sku5090.ncfPerKw,
      higherIsBetter: true,
    },
  ];

  const y1a = sku5090.years[0];
  const y1b = skuPro6000.years[0];
  const opexRows: MetricRow[] =
    y1a && y1b
      ? [
          {
            metric: t("electricity"),
            a: usd(y1a.electricity),
            b: usd(y1b.electricity),
            delta: signedUsd(y1b.electricity - y1a.electricity),
            deltaValue: y1b.electricity - y1a.electricity,
            higherIsBetter: false,
          },
          {
            metric: t("network"),
            a: usd(y1a.network),
            b: usd(y1b.network),
            delta: signedUsd(y1b.network - y1a.network),
            deltaValue: y1b.network - y1a.network,
            higherIsBetter: false,
          },
          {
            metric: t("om"),
            a: usd(y1a.om),
            b: usd(y1b.om),
            delta: signedUsd(y1b.om - y1a.om),
            deltaValue: y1b.om - y1a.om,
            higherIsBetter: false,
          },
          {
            metric: t("insuranceRent"),
            a: usd(y1a.insurance),
            b: usd(y1b.insurance),
            delta: signedUsd(y1b.insurance - y1a.insurance),
            deltaValue: y1b.insurance - y1a.insurance,
            higherIsBetter: false,
          },
          {
            metric: t("propertyTaxCapex"),
            a: usd(y1a.propertyTax),
            b: usd(y1b.propertyTax),
            delta: signedUsd(y1b.propertyTax - y1a.propertyTax),
            deltaValue: y1b.propertyTax - y1a.propertyTax,
            higherIsBetter: false,
          },
          {
            metric: t("otherRent"),
            a: usd(y1a.otherOpex),
            b: usd(y1b.otherOpex),
            delta: signedUsd(y1b.otherOpex - y1a.otherOpex),
            deltaValue: y1b.otherOpex - y1a.otherOpex,
            higherIsBetter: false,
          },
          {
            metric: t("totalOpex"),
            a: usd(y1a.totalOpex),
            b: usd(y1b.totalOpex),
            delta: signedUsd(y1b.totalOpex - y1a.totalOpex),
            deltaValue: y1b.totalOpex - y1a.totalOpex,
            higherIsBetter: false,
          },
        ]
      : [];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("thisRun")}</CardTitle>
          <CardDescription>{t("thisRunDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("input")}</TableHead>
                <TableHead className="text-right">RTX 5090</TableHead>
                <TableHead className="text-right">Pro 6000</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t("serverPrice")}</TableCell>
                <TableCell className="text-right font-mono">{usd(inputs.sku5090.serverPrice)}</TableCell>
                <TableCell className="text-right font-mono">{usd(inputs.skuPro6000.serverPrice)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("gpuRentCompare")}</TableCell>
                <TableCell className="text-right font-mono">${inputs.sku5090.gpuRentPerHr.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">${inputs.skuPro6000.gpuRentPerHr.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("matrixUtil")}</TableCell>
                <TableCell className="text-right font-mono">{pct(inputs.sku5090.utilization, 0)}</TableCell>
                <TableCell className="text-right font-mono">{pct(inputs.skuPro6000.utilization, 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MetricTable
        title={t("kpis")}
        description={t("kpisDesc", { obbba })}
        rows={kpiRows}
      />
      <MetricTable
        title={t("returns")}
        description={t("returnsDesc")}
        rows={returnRows}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("taxPath")}</CardTitle>
          <CardDescription>
            {t(inputs.obbbaEnabled ? "taxPathOn" : "taxPathOff", { obbba })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="h-auto align-bottom">
                  {t("yearlyYear")}
                </TableHead>
                <TableHead colSpan={4} className="text-center">
                  RTX 5090
                </TableHead>
                <TaxSplitHead />
                <TableHead colSpan={4} className="text-center">
                  Pro 6000
                </TableHead>
              </TableRow>
              <TableRow>
                <TaxMetricHeads />
                <TaxMetricHeads />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sku5090.years.map((y, i) => {
                const b = skuPro6000.years[i];
                return (
                  <TableRow key={y.year}>
                    <TableCell>Y{y.year}</TableCell>
                    <TaxSkuCells
                      depreciation={y.depreciation}
                      ebit={y.ebit}
                      tax={y.tax}
                      nol={y.nolRemaining}
                    />
                    <TaxSplitCell />
                    {b ? (
                      <TaxSkuCells
                        depreciation={b.depreciation}
                        ebit={b.ebit}
                        tax={b.tax}
                        nol={b.nolRemaining}
                      />
                    ) : (
                      <>
                        <TableCell className="text-right font-mono">—</TableCell>
                        <TableCell className="text-right font-mono">—</TableCell>
                        <TableCell className="text-right font-mono">—</TableCell>
                        <TableCell className="text-right font-mono">—</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MetricTable
        title={t("unitEcon")}
        description={t("unitEconDesc")}
        rows={unitRows}
      />
      <MetricTable
        title={t("opexTitle")}
        description={t("opexDesc")}
        rows={opexRows}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("cumulativeNcf")}</CardTitle>
          <CardDescription>{caption}</CardDescription>
        </CardHeader>
        <CardContent>
          <CumulativeChart
            series={[
              { id: "a", label: sku5090.skuLabel, result: sku5090 },
              { id: "b", label: skuPro6000.skuLabel, result: skuPro6000 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
