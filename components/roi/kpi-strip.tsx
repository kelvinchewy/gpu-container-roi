import { Card, CardContent } from "@/components/ui/card";
import { monthLabel, usd, years } from "@/lib/roi/format";
import type { SkuResult } from "@/lib/roi/types";

export function KpiStrip({ result }: { result: SkuResult }) {
  const items = [
    { label: "CapEx", value: usd(result.totalCapex) },
    { label: "Y1 NCF", value: usd(result.y1Ncf) },
    { label: "Payback", value: years(result.paybackYears) },
    { label: "IRR", value: result.irr == null ? "—" : `${(result.irr * 100).toFixed(2)}%` },
    { label: "NPV", value: usd(result.npv) },
    { label: "Residual (Y5)", value: usd(result.residualCash) },
    { label: "Breakeven month", value: monthLabel(result.breakevenMonth) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="grid gap-1">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="font-mono text-sm font-medium tabular-nums">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
