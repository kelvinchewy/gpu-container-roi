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
  CLOUD_APP_SHARE,
  CONTEXT_AS_OF,
  GPU_HR_COMPARE,
  LLAMA70_CHECK,
  TOKEN_BILLING,
  UNIT_COMPARE,
  USE_CASES_COMPARE,
} from "@/lib/roi/sources";

import { ContextDecayChart } from "./context-decay-chart";
import { ContextPies } from "./context-pies";

function Caption({ children }: { children: ReactNode }) {
  return (
    <TableCaption className="mt-3 text-left text-xs text-muted-foreground whitespace-normal">
      {children}
    </TableCaption>
  );
}

function PriceCell({ price, who }: { price: string; who: string }) {
  return (
    <TableCell className="text-right">
      <div className="font-mono tabular-nums">{price}</div>
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
                <TableCell className="font-mono tabular-nums">$ / GPU-hr</TableCell>
                <TableCell className="font-mono tabular-nums">$ / M tok</TableCell>
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
          <ContextPies />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>What it means</TableHead>
                <TableHead>RTX 5090 · 32 GB</TableHead>
                <TableHead>RTX Pro 6000 · 96 GB</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {USE_CASES_COMPARE.map((row) => {
                const cat = CLOUD_APP_SHARE.find((item) => item.key === row.key);
                return (
                  <TableRow key={`${row.key}-${row.job}`}>
                    <TableCell className="align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2 shrink-0 rounded-[2px]"
                          style={{ background: cat?.fill }}
                        />
                        {cat?.name}
                      </span>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">{row.job}</TableCell>
                    <TableCell className="align-top whitespace-normal text-muted-foreground">
                      {row.means}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">{row.sku5090}</TableCell>
                    <TableCell className="align-top whitespace-normal">{row.pro6000}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <Caption>
              Category = Dataintelo $ mix (same colors as the pie). Job = what fits on 32 GB vs 96
              GB. Video: 1080 ~8 GB · 4K ~12 GB · 6K/8K 20 GB+ (Puget).{" "}
              <a className="underline underline-offset-4" href={CITE.dataintelo}>
                Dataintelo
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.spheron5090vsPro}>
                Spheron VRAM fit
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.dellProVsConsumer}>
                Dell SPECviewperf
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.mercatusLongContext}>
                Mercatus
              </a>
              {" · "}
              <a className="underline underline-offset-4" href={CITE.pugetResolveVram}>
                Puget Resolve VRAM
              </a>
            </Caption>
          </Table>
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
              ). Dotted forecast = last print held to Aug 2027 and Aug 2029. Dashed line = OpEx
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
              to Aug 2027 and Aug 2029. Suggested {usd(SUGGESTED_RENT.pro6000, 2)}.
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
                  <TableCell className="text-right font-mono tabular-nums">{row.openrouter}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{row.ecohash}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <Caption>
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
          <CardDescription>GPU rent vs token revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">GPU rent / hr</TableHead>
                <TableHead className="text-right">Token / hr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UNIT_COMPARE.map((row) => (
                <TableRow key={`${row.sku}-${row.model}`}>
                  <TableCell className="align-top whitespace-normal">{row.sku}</TableCell>
                  <TableCell className="align-top whitespace-normal">{row.model}</TableCell>
                  <PriceCell price={row.gpuRent} who={row.gpuRentWho} />
                  <PriceCell price={row.tokenHr} who={row.tokenHrWho} />
                </TableRow>
              ))}
            </TableBody>
            <Caption>
              5090 = Flash 8× TP=8 (measured). Pro 6000 = Llama 3.3 70B FP8 1× (placeholder).
              OpenRouter $
              {LLAMA70_CHECK.openrouterInPerM.toFixed(2)} / $
              {LLAMA70_CHECK.openrouterOutPerM.toFixed(2)} / M.{" "}
              <a className="underline underline-offset-4" href={CITE.openrouterLlama70}>
                OpenRouter Llama 3.3 70B
              </a>
            </Caption>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exclusions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-xs text-muted-foreground">
            <li>No utilization ramp</li>
            <li>No freight / customs / install</li>
            <li>No EcoHash fee</li>
            <li>Y1 = full year at stated utilization</li>
            <li>Unlevered</li>
            <li>Residual = servers only</li>
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
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
