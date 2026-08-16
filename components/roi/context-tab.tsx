import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usd } from "@/lib/roi/format";
import {
  ELEC_PER_GPU_HR_TDP,
  OPEX_BREAK_EVEN_PER_GPU_HR,
  SUGGESTED_RENT,
} from "@/lib/roi/listed-forecast";
import {
  CITE,
  CONTEXT_AS_OF,
  FLASH_LOAD,
  GPU_HR_COMPARE,
  TOKEN_BILLING,
  UNIT_COMPARE,
  USE_CASES_COMPARE,
} from "@/lib/roi/sources";

import { ContextDecayChart } from "./context-decay-chart";
import { ContextPies } from "./context-pies";

function Caption({ children }: { children: ReactNode }) {
  return (
    <TableCaption className="mt-3 text-left text-xs whitespace-normal">
      {children}
    </TableCaption>
  );
}

function PriceCell({ price, who }: { price: string; who: string }) {
  return (
    <TableCell className="text-right">
      <div className="font-mono">{price}</div>
      <div className="text-xs text-muted-foreground whitespace-normal">{who}</div>
    </TableCell>
  );
}

export function ContextTab() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sold as</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Bare metal / on-demand</TableHead>
                <TableHead>Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-muted-foreground">Unit</TableCell>
                <TableCell className="font-mono">$ / GPU-hr</TableCell>
                <TableCell className="font-mono">$ / M tok</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-muted-foreground">Fits</TableCell>
                <TableCell className="whitespace-normal">Train · render · self-host</TableCell>
                <TableCell className="whitespace-normal">Chat · coder · agent</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best for</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>RTX 5090</TableHead>
                <TableHead>RTX Pro 6000</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USE_CASES_COMPARE.map((row) => (
                <TableRow key={row.job}>
                  <TableCell>{row.job}</TableCell>
                  <TableCell className="whitespace-normal">{row.sku5090}</TableCell>
                  <TableCell className="whitespace-normal">{row.pro6000}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ContextPies />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GPU-hour</CardTitle>
          <CardDescription>
            {CONTEXT_AS_OF}. EcoHash billed per second. High = hyperscaler.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">EcoHash</TableHead>
                <TableHead className="text-right">Low</TableHead>
                <TableHead className="text-right">Mid</TableHead>
                <TableHead className="text-right">High</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GPU_HR_COMPARE.map((row) => (
                <TableRow key={row.sku}>
                  <TableCell>{row.sku}</TableCell>
                  <PriceCell price={row.ecohash} who={row.ecohashWho} />
                  <PriceCell price={row.low} who={row.lowWho} />
                  <PriceCell price={row.mid} who={row.midWho} />
                  <PriceCell price={row.high} who={row.highWho} />
                </TableRow>
              ))}
            </TableBody>
            <Caption>
              On-demand avg = mean of getdeploying on-demand listings, not a single venue.
              {" · "}
              <a className="underline underline-offset-4" href={CITE.ecohashPricing}>
                ecohash.com/pricing
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.listing5090}>
                getdeploying 5090
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.listingPro6000}>
                Pro 6000
              </a>
            </Caption>
          </Table>

          <ContextDecayChart />
          <div className="grid gap-2 text-xs text-muted-foreground">
            <p>
              RTX 5090 · listed Aug 2025–Aug 2026 (
              <a className="underline underline-offset-4" href={CITE.listing5090}>
                getdeploying
              </a>
              ; May Spheron; Jul{" "}
              <a className="underline underline-offset-4" href={CITE.packet5090}>
                Packet.ai
              </a>
              ). Dotted forecast = last print held to Aug 2027 and Aug 2029. Grey line = OpEx
              break-even {usd(OPEX_BREAK_EVEN_PER_GPU_HR, 2)}/GPU-hr. Electricity ~
              {usd(ELEC_PER_GPU_HR_TDP, 2)} (PUE 1.3 · $0.06/kWh · 575 W) vs suggested{" "}
              {usd(SUGGESTED_RENT.sku5090, 2)}.
            </p>
            <p>
              Pro 6000 · listed Aug 2025 and Aug 2026 (
              <a className="underline underline-offset-4" href={CITE.listingPro6000}>
                getdeploying
              </a>
              ). No May/Jul print; straight line spans the gap. Dotted forecast = last print held
              to Aug 2027 and Aug 2029. Suggested {usd(SUGGESTED_RENT.pro6000, 2)}. Does not feed
              runModel.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How DeepSeek-V4-Flash bills</CardTitle>
          <CardDescription>Two meters. Not GPU time.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meter</TableHead>
                <TableHead>What</TableHead>
                <TableHead className="text-right">OpenRouter</TableHead>
                <TableHead className="text-right">EcoHash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TOKEN_BILLING.map((row) => (
                <TableRow key={row.meter}>
                  <TableCell>{row.meter}</TableCell>
                  <TableCell className="whitespace-normal">{row.what}</TableCell>
                  <TableCell className="text-right font-mono">{row.openrouter}</TableCell>
                  <TableCell className="text-right font-mono">{row.ecohash}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <Caption>
              Token / hr uses OpenRouter ${FLASH_LOAD.openrouterInPerM.toFixed(2)} / $
              {FLASH_LOAD.openrouterOutPerM.toFixed(2)}.{" "}
              <a className="underline underline-offset-4" href={CITE.openrouterFlash}>
                OpenRouter DeepSeek-V4-Flash
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.ecohashPricing}>
                ecohash.com/pricing
              </a>
            </Caption>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Same unit · $/GPU-hr</CardTitle>
          <CardDescription>GPU rent vs token revenue on one 5090-hour.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">GPU rent / hr</TableHead>
                <TableHead className="text-right">Token / hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UNIT_COMPARE.map((row) => (
                <TableRow key={row.sku}>
                  <TableCell>{row.sku}</TableCell>
                  <PriceCell price={row.gpuRent} who={row.gpuRentWho} />
                  <PriceCell price={row.tokenHr} who={row.tokenHrWho} />
                </TableRow>
              ))}
            </TableBody>
            <Caption>
              5090 token / hr is a check, not the calculator. Measured 8×5090 full load:{" "}
              {FLASH_LOAD.inTokPerSec.toLocaleString("en-US")} in tok/s ·{" "}
              {FLASH_LOAD.outTokPerSec.toLocaleString("en-US")} out tok/s. Working hour uses agentic{" "}
              {FLASH_LOAD.inOutRatio}:1 mix ({FLASH_LOAD.inPerHourM} M in + {FLASH_LOAD.outPerHourM} M
              out), not tok/s × 3,600. OpenRouter $
              {FLASH_LOAD.openrouterInPerM.toFixed(2)} / ${FLASH_LOAD.openrouterOutPerM.toFixed(2)} → $
              {FLASH_LOAD.usdPerHour8.toFixed(2)} / {FLASH_LOAD.gpus} GPUs = $
              {FLASH_LOAD.usdPerGpuHr.toFixed(4)} per GPU-hr. Pro 6000 = — (no matching bench). GPU
              rent cells are listed, not Reset.
            </Caption>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            <li>No utilization ramp</li>
            <li>No freight / customs / install</li>
            <li>No EcoHash fee</li>
            <li>Y1 = full year at stated utilization</li>
            <li>Unlevered</li>
            <li>Residual = servers only</li>
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <a className="underline underline-offset-4" href="https://ecohash.com">
          ecohash.com
        </a>
        {" · "}
        <a className="underline underline-offset-4" href={CITE.ecohashPricing}>
          ecohash.com/pricing
        </a>
        {" · "}
        <a className="underline underline-offset-4" href="https://colocation.ecohash.com">
          colocation.ecohash.com
        </a>
        {" · "}
        <a className="underline underline-offset-4" href={CITE.listing5090}>
          getdeploying.com
        </a>
        {" · "}
        <a className="underline underline-offset-4" href={CITE.dataintelo}>
          Dataintelo cloud GPU instance
        </a>
      </p>
    </div>
  );
}
