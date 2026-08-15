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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usd } from "@/lib/roi/format";
import type { SkuResult } from "@/lib/roi/types";

import { OpexChart } from "./opex-chart";

export function YearlyDisclosure({ result }: { result: SkuResult }) {
  return (
    <Accordion>
      <AccordionItem value="yearly">
        <AccordionTrigger>Yearly P&L + cash flow</AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 overflow-x-auto pt-2">
            <OpexChart result={result} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">OpEx</TableHead>
                  <TableHead className="text-right">EBITDA</TableHead>
                  <TableHead className="text-right">Dep</TableHead>
                  <TableHead className="text-right">EBIT</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">NOL</TableHead>
                  <TableHead className="text-right">NCF</TableHead>
                  <TableHead className="text-right">Residual</TableHead>
                  <TableHead className="text-right">Cash flow</TableHead>
                  <TableHead className="text-right">Cumulative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Y0</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">—</TableCell>
                  <TableCell className="text-right font-mono">
                    {usd(result.cashFlows[0])}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {usd(result.cashFlows[0])}
                  </TableCell>
                </TableRow>
                {result.years.map((y) => (
                  <TableRow key={y.year}>
                    <TableCell>Y{y.year}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.revenue)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.totalOpex)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.ebitda)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.depreciation)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.ebit)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.tax)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {y.nolRemaining ? usd(y.nolRemaining) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{usd(y.ncf)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {y.residualCash ? usd(y.residualCash) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{usd(y.cashFlow)}</TableCell>
                    <TableCell className="text-right font-mono">{usd(y.cumulative)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
