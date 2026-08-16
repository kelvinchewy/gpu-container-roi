"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_INPUTS } from "@/lib/roi/defaults";
import { cloneBom } from "@/lib/roi/sources";
import { runModel } from "@/lib/roi/engine";
import { clampInputs, inputsFromSearchParams, parseTab, searchParamsFromState } from "@/lib/roi/url";
import type { ModelInputs, SkuId, SkuInputs, TabId } from "@/lib/roi/types";

import { ChromeBar } from "./chrome-bar";
import { CompareTab } from "./compare-tab";
import { ContextTab } from "./context-tab";
import { GpuTab } from "./gpu-tab";

function subscribeNoop() {
  return () => {};
}

export function RoiApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get("tab")));
  const [inputs, setInputs] = useState<ModelInputs>(() =>
    inputsFromSearchParams(searchParams),
  );
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const result = useMemo(() => runModel(inputs), [inputs]);

  useEffect(() => {
    const next = searchParamsFromState(tab, inputs).toString();
    const current = searchParams.toString();
    if (next === current) return;
    const id = window.setTimeout(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, tab === parseTab(searchParams.get("tab")) ? 200 : 0);
    return () => window.clearTimeout(id);
  }, [tab, inputs, pathname, router, searchParams]);

  function patchInputs(patch: Partial<ModelInputs>) {
    setInputs((prev) => clampInputs({ ...prev, ...patch }));
  }

  function patchSku(skuId: SkuId, patch: Partial<SkuInputs>) {
    setInputs((prev) => {
      const key = skuId === "5090" ? "sku5090" : "skuPro6000";
      return clampInputs({ ...prev, [key]: { ...prev[key], ...patch } });
    });
  }

  function reset() {
    setInputs(
      clampInputs({
        ...DEFAULT_INPUTS,
        sku5090: { ...DEFAULT_INPUTS.sku5090, bom: cloneBom(DEFAULT_INPUTS.sku5090.bom) },
        skuPro6000: { ...DEFAULT_INPUTS.skuPro6000, bom: cloneBom(DEFAULT_INPUTS.skuPro6000.bom) },
      }),
    );
  }

  const showChrome = tab !== "context";

  if (!ready) {
    return <main className="p-6 text-sm text-muted-foreground">Loading</main>;
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value === "string") setTab(parseTab(value));
        }}
      >
        <div className="grid gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-medium tracking-tight">GPU Container ROI</h1>
            {showChrome ? (
              <Button variant="outline" size="sm" onClick={reset}>
                Reset
              </Button>
            ) : null}
          </div>
          <TabsList variant="line" className="h-10 w-full min-w-0 overflow-x-auto">
            <TabsTrigger className="px-2 text-xs sm:px-3 sm:text-sm" value="5090">
              RTX 5090
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs sm:px-3 sm:text-sm" value="pro6000">
              Pro 6000
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs sm:px-3 sm:text-sm" value="compare">
              Compare
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs sm:px-3 sm:text-sm" value="context">
              Context
            </TabsTrigger>
          </TabsList>
          {showChrome ? (
            <ChromeBar inputs={inputs} onChange={patchInputs} onSkuChange={patchSku} />
          ) : null}
        </div>
        <TabsContent className="pt-6" value="5090">
          <GpuTab
            skuId="5090"
            inputs={inputs}
            result={result.sku5090}
            onSkuChange={patchSku}
          />
        </TabsContent>
        <TabsContent className="pt-6" value="pro6000">
          <GpuTab
            skuId="pro6000"
            inputs={inputs}
            result={result.skuPro6000}
            onSkuChange={patchSku}
          />
        </TabsContent>
        <TabsContent className="pt-6" value="compare">
          <CompareTab
            inputs={inputs}
            sku5090={result.sku5090}
            skuPro6000={result.skuPro6000}
          />
        </TabsContent>
        <TabsContent className="pt-6" value="context">
          <ContextTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
