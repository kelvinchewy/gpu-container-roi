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
import { useT } from "./locale";

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

export function YearlyDisclosure({ result }: { result: SkuResult }) {
  const { t } = useT();
  const heads = [
    { label: t("yearlyYear"), tip: t("yearlyYearTip") },
    { label: t("yearlyRevenue"), tip: t("yearlyRevenueTip") },
    { label: t("yearlyOpex"), tip: t("yearlyOpexTip") },
    { label: t("yearlyEbitda"), tip: t("yearlyEbitdaTip") },
    { label: t("yearlyDep"), tip: t("yearlyDepTip") },
    { label: t("yearlyEbit"), tip: t("yearlyEbitTip") },
    { label: t("yearlyTax"), tip: t("yearlyTaxTip") },
    { label: t("yearlyNol"), tip: t("yearlyNolTip") },
    { label: t("yearlyNcf"), tip: t("yearlyNcfTip") },
    { label: t("yearlyResidual"), tip: t("yearlyResidualTip") },
    { label: t("yearlyCashFlow"), tip: t("yearlyCashFlowTip") },
    { label: t("yearlyCumulative"), tip: t("yearlyCumulativeTip") },
  ];

  return (
    <Accordion defaultValue={["yearly"]}>
      <AccordionItem value="yearly">
        <AccordionTrigger>{t("yearlyTitle")}</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2">
            <OpexChart result={result} />
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  {heads.map((h, i) => (
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
                {t("yearlyCaption")}
              </TableCaption>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
