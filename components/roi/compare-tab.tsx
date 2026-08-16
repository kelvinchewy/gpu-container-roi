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
import { cn } from "@/lib/utils";

import { CumulativeChart } from "./cumulative-chart";

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
  return proBetter ? "text-chart-2" : "text-destructive";
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
  return (
    <>
      <TableHead className="text-right">
        <HeadTip
          label="Dep"
          tip="Depreciation this year. OBBBA on: 100% of depreciable basis in Y1. OBBBA off: even split over the useful life."
        />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip
          label="EBIT"
          tip="EBITDA minus depreciation. A Y1 loss under OBBBA is the bonus creating NOL."
        />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip label="Tax" tip="Cash tax paid this year." />
      </TableHead>
      <TableHead className="text-right">
        <HeadTip
          label="NOL"
          tip="Unused tax loss carried forward. Later years can offset up to 80% of EBITDA."
        />
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

function signedYears(value: number | null, other: number | null): string {
  if (value == null || other == null) return "—";
  const d = value - other;
  const abs = `${Math.abs(d).toFixed(2)} yrs`;
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
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">RTX 5090</TableHead>
              <TableHead className="text-right">Pro 6000</TableHead>
              <TableHead className="text-right">
                <HeadTip
                  label="Delta"
                  tip="Pro 6000 − RTX 5090. Teal = Pro 6000 better on this metric. Red = 5090 better."
                />
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
  const caption = chartCaption(inputs, "5090 vs Pro 6000");
  const obbba = inputs.obbbaEnabled ? "OBBBA on" : "OBBBA off";

  const kpiRows: MetricRow[] = [
    {
      metric: "CapEx",
      a: usd(sku5090.totalCapex),
      b: usd(skuPro6000.totalCapex),
      delta: signedUsd(skuPro6000.totalCapex - sku5090.totalCapex),
      deltaValue: skuPro6000.totalCapex - sku5090.totalCapex,
      higherIsBetter: false,
    },
    {
      metric: "Y1 NCF",
      a: usd(sku5090.y1Ncf),
      b: usd(skuPro6000.y1Ncf),
      delta: signedUsd(skuPro6000.y1Ncf - sku5090.y1Ncf),
      deltaValue: skuPro6000.y1Ncf - sku5090.y1Ncf,
      higherIsBetter: true,
    },
    {
      metric: "Payback",
      a: years(sku5090.paybackYears),
      b: years(skuPro6000.paybackYears),
      delta: signedYears(skuPro6000.paybackYears, sku5090.paybackYears),
      deltaValue:
        skuPro6000.paybackYears == null || sku5090.paybackYears == null
          ? null
          : skuPro6000.paybackYears - sku5090.paybackYears,
      higherIsBetter: false,
    },
    {
      metric: "IRR",
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
      metric: "NPV",
      a: usd(sku5090.npv),
      b: usd(skuPro6000.npv),
      delta: signedUsd(skuPro6000.npv - sku5090.npv),
      deltaValue: skuPro6000.npv - sku5090.npv,
      higherIsBetter: true,
    },
    {
      metric: `Residual (Y${sku5090.years.length})`,
      a: usd(sku5090.residualCash),
      b: usd(skuPro6000.residualCash),
      delta: signedUsd(skuPro6000.residualCash - sku5090.residualCash),
      deltaValue: skuPro6000.residualCash - sku5090.residualCash,
      higherIsBetter: true,
    },
    {
      metric: "Breakeven month",
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
      metric: "Cash-on-cash",
      a: pct(sku5090.cashOnCash, 2),
      b: pct(skuPro6000.cashOnCash, 2),
      delta: signedPctPts(skuPro6000.cashOnCash, sku5090.cashOnCash),
      deltaValue: skuPro6000.cashOnCash - sku5090.cashOnCash,
      higherIsBetter: true,
    },
    {
      metric: "Total ROI",
      a: pct(sku5090.totalRoi, 2),
      b: pct(skuPro6000.totalRoi, 2),
      delta: signedPctPts(skuPro6000.totalRoi, sku5090.totalRoi),
      deltaValue: skuPro6000.totalRoi - sku5090.totalRoi,
      higherIsBetter: true,
    },
    {
      metric: "MOIC",
      a: multiple(sku5090.moic),
      b: multiple(skuPro6000.moic),
      delta: signedMultiple(skuPro6000.moic, sku5090.moic),
      deltaValue: skuPro6000.moic - sku5090.moic,
      higherIsBetter: true,
    },
  ];

  const unitRows: MetricRow[] = [
    {
      metric: "Revenue / GPU",
      a: usd(sku5090.revenuePerGpu),
      b: usd(skuPro6000.revenuePerGpu),
      delta: signedUsd(skuPro6000.revenuePerGpu - sku5090.revenuePerGpu),
      deltaValue: skuPro6000.revenuePerGpu - sku5090.revenuePerGpu,
      higherIsBetter: true,
    },
    {
      metric: "OpEx / GPU",
      a: usd(sku5090.opexPerGpu),
      b: usd(skuPro6000.opexPerGpu),
      delta: signedUsd(skuPro6000.opexPerGpu - sku5090.opexPerGpu),
      deltaValue: skuPro6000.opexPerGpu - sku5090.opexPerGpu,
      higherIsBetter: false,
    },
    {
      metric: "NCF / GPU",
      a: usd(sku5090.ncfPerGpu),
      b: usd(skuPro6000.ncfPerGpu),
      delta: signedUsd(skuPro6000.ncfPerGpu - sku5090.ncfPerGpu),
      deltaValue: skuPro6000.ncfPerGpu - sku5090.ncfPerGpu,
      higherIsBetter: true,
    },
    {
      metric: "CapEx / GPU",
      a: usd(sku5090.capexPerGpu),
      b: usd(skuPro6000.capexPerGpu),
      delta: signedUsd(skuPro6000.capexPerGpu - sku5090.capexPerGpu),
      deltaValue: skuPro6000.capexPerGpu - sku5090.capexPerGpu,
      higherIsBetter: false,
    },
    {
      metric: "Revenue / kW",
      a: usd(sku5090.revenuePerKw),
      b: usd(skuPro6000.revenuePerKw),
      delta: signedUsd(skuPro6000.revenuePerKw - sku5090.revenuePerKw),
      deltaValue: skuPro6000.revenuePerKw - sku5090.revenuePerKw,
      higherIsBetter: true,
    },
    {
      metric: "NCF / kW",
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
            metric: "Electricity",
            a: usd(y1a.electricity),
            b: usd(y1b.electricity),
            delta: signedUsd(y1b.electricity - y1a.electricity),
            deltaValue: y1b.electricity - y1a.electricity,
            higherIsBetter: false,
          },
          {
            metric: "Network",
            a: usd(y1a.network),
            b: usd(y1b.network),
            delta: signedUsd(y1b.network - y1a.network),
            deltaValue: y1b.network - y1a.network,
            higherIsBetter: false,
          },
          {
            metric: "O&M",
            a: usd(y1a.om),
            b: usd(y1b.om),
            delta: signedUsd(y1b.om - y1a.om),
            deltaValue: y1b.om - y1a.om,
            higherIsBetter: false,
          },
          {
            metric: "Insurance (% of rent)",
            a: usd(y1a.insurance),
            b: usd(y1b.insurance),
            delta: signedUsd(y1b.insurance - y1a.insurance),
            deltaValue: y1b.insurance - y1a.insurance,
            higherIsBetter: false,
          },
          {
            metric: "Property tax (% of capex)",
            a: usd(y1a.propertyTax),
            b: usd(y1b.propertyTax),
            delta: signedUsd(y1b.propertyTax - y1a.propertyTax),
            deltaValue: y1b.propertyTax - y1a.propertyTax,
            higherIsBetter: false,
          },
          {
            metric: "Other (% of rent)",
            a: usd(y1a.otherOpex),
            b: usd(y1b.otherOpex),
            delta: signedUsd(y1b.otherOpex - y1a.otherOpex),
            deltaValue: y1b.otherOpex - y1a.otherOpex,
            higherIsBetter: false,
          },
          {
            metric: "Total OpEx",
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
          <CardTitle>This run</CardTitle>
          <CardDescription>
            From the RTX 5090 and Pro 6000 tabs. Shared power, tax, and topology still apply above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Input</TableHead>
                <TableHead className="text-right">RTX 5090</TableHead>
                <TableHead className="text-right">Pro 6000</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Server price</TableCell>
                <TableCell className="text-right font-mono">{usd(inputs.sku5090.serverPrice)}</TableCell>
                <TableCell className="text-right font-mono">{usd(inputs.skuPro6000.serverPrice)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>GPU rent ($/GPU-hr)</TableCell>
                <TableCell className="text-right font-mono">${inputs.sku5090.gpuRentPerHr.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">${inputs.skuPro6000.gpuRentPerHr.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Utilization</TableCell>
                <TableCell className="text-right font-mono">{pct(inputs.sku5090.utilization, 0)}</TableCell>
                <TableCell className="text-right font-mono">{pct(inputs.skuPro6000.utilization, 0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MetricTable
        title="KPIs"
        description={`Pro 6000 − RTX 5090 · ${obbba}`}
        rows={kpiRows}
      />
      <MetricTable
        title="Returns"
        description="Cash-on-cash = mean operating NCF / CapEx. MOIC includes residual."
        rows={returnRows}
      />
      <Card>
        <CardHeader>
          <CardTitle>Tax path</CardTitle>
          <CardDescription>
            How each year is taxed after depreciation · {obbba}
            {inputs.obbbaEnabled
              ? " · Y1 writes off the full depreciable basis"
              : " · depreciation is split evenly each year"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="h-auto align-bottom">
                  Year
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
        title="Unit economics"
        description="Y1 active path · per GPU and per facility kW (IT × PUE)"
        rows={unitRows}
      />
      <MetricTable
        title="OpEx"
        description="Y1 · electricity from IT load × PUE × tariff; insurance / other from rent; property tax from capex"
        rows={opexRows}
      />
      <Card>
        <CardHeader>
          <CardTitle>Cumulative NCF ($)</CardTitle>
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
