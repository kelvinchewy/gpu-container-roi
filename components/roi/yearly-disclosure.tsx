"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usdParenK } from "@/lib/roi/format";
import type { SkuResult } from "@/lib/roi/types";

import { OpexChart } from "./opex-chart";

function HeadTip({ label, tip }: { label: string; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help text-inherit underline decoration-dotted underline-offset-4">
        {label}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-left">{tip}</TooltipContent>
    </Tooltip>
  );
}

function Money({ value }: { value: number | null }) {
  if (value == null) {
    return <TableCell className="px-1.5 text-right font-mono text-xs text-muted-foreground">—</TableCell>;
  }
  return (
    <TableCell className="px-1.5 text-right font-mono text-xs tabular-nums">
      {usdParenK(value)}
    </TableCell>
  );
}

const HEADS: { label: string; tip: string }[] = [
  { label: "Year", tip: "Calendar year. Y0 is the capex outlay. Y1–Yn are operating years." },
  {
    label: "Revenue",
    tip: "GPU-hour rent × hours per year × utilization. Steps down only if price decay is on.",
  },
  {
    label: "OpEx",
    tip: "Electricity + network + O&M + insurance + property tax + other. Electricity follows IT × PUE × tariff.",
  },
  { label: "EBITDA", tip: "Revenue − OpEx. Cash operating profit before depreciation and tax." },
  {
    label: "Dep",
    tip: "Depreciation this year. OBBBA on: 100% of depreciable basis (server capex × (1 − residual)) in Y1. OBBBA off: that basis split evenly over the useful life.",
  },
  {
    label: "EBIT",
    tip: "EBITDA − depreciation. A Y1 loss under OBBBA is the bonus creating NOL. Not a cash line.",
  },
  {
    label: "Tax",
    tip: "Cash tax this year. Combined federal + state on taxable income. OBBBA Y1 is often $0 if the bonus creates a loss.",
  },
  {
    label: "NOL",
    tip: "Unused tax loss carried forward. Later years may offset up to 80% of EBITDA while NOL remains.",
  },
  {
    label: "NCF",
    tip: "Operating net cash = EBITDA − tax. Residual is not in this column.",
  },
  {
    label: "Residual",
    tip: "Server exit cash in the final year only (server capex × residual %). Infra is not included.",
  },
  {
    label: "Cash flow",
    tip: "Y0 = −CapEx. Y1–Yn = NCF. Final year = NCF + residual.",
  },
  {
    label: "Cumulative",
    tip: "Undiscounted running total from Y0. OBBBA vs straight-line often match at year N if the Y1 bonus NOL is used up — same total tax, different timing. The OBBBA edge is NPV, IRR, and payback, not a larger ending pile.",
  },
];

export function YearlyDisclosure({ result }: { result: SkuResult }) {
  return (
    <Accordion defaultValue={["yearly"]}>
      <AccordionItem value="yearly">
        <AccordionTrigger>Yearly P&L + cash flow</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2">
            <OpexChart result={result} />
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  {HEADS.map((h, i) => (
                    <TableHead
                      key={h.label}
                      className={i === 0 ? "px-1.5" : "px-1.5 text-right"}
                    >
                      <HeadTip label={h.label} tip={h.tip} />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-1.5 font-mono text-xs">Y0</TableCell>
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={null} />
                  <Money value={result.cashFlows[0] ?? 0} />
                  <Money value={result.cashFlows[0] ?? 0} />
                </TableRow>
                {result.years.map((y) => (
                  <TableRow key={y.year}>
                    <TableCell className="px-1.5 font-mono text-xs">Y{y.year}</TableCell>
                    <Money value={y.revenue} />
                    <Money value={y.totalOpex} />
                    <Money value={y.ebitda} />
                    <Money value={y.depreciation} />
                    <Money value={y.ebit} />
                    <Money value={y.tax} />
                    <Money value={y.nolRemaining || null} />
                    <Money value={y.ncf} />
                    <Money value={y.residualCash || null} />
                    <Money value={y.cashFlow} />
                    <Money value={y.cumulative} />
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption className="mt-3 text-left text-xs text-muted-foreground">
                $000. ( ) = negative. Hover a header for the definition.
              </TableCaption>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
