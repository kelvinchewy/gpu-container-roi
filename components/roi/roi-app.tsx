"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_INPUTS } from "@/lib/roi/defaults";
import { htmlLang, parseLocale, type Locale } from "@/lib/roi/i18n";
import { cloneBom } from "@/lib/roi/sources";
import { runModel } from "@/lib/roi/engine";
import { clampInputs, inputsFromSearchParams, parseTab, searchParamsFromState } from "@/lib/roi/url";
import type { Gb300Facility, ModelInputs, SkuId, SkuInputs, TabId } from "@/lib/roi/types";
import { SKU_STATE_KEY } from "@/lib/roi/types";

import { ChromeBar } from "./chrome-bar";
import { CompareTab } from "./compare-tab";
import { GpuTab } from "./gpu-tab";
import { LanguageToggle } from "./language-toggle";
import { LocaleProvider, useT } from "./locale";

function subscribeNoop() {
  return () => {};
}

export function RoiApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get("tab")));
  const [locale, setLocale] = useState<Locale>(() => parseLocale(searchParams.get("lang")));
  const [inputs, setInputs] = useState<ModelInputs>(() =>
    inputsFromSearchParams(searchParams),
  );
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const lastWritten = useRef<string | null>(null);

  const result = useMemo(() => runModel(inputs), [inputs]);

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
  }, [locale]);

  // Back / pasted URL: apply tab, lang, and inputs. Skip our own replace via lastWritten.
  useEffect(() => {
    const q = searchParams.toString();
    if (q === lastWritten.current) return;
    lastWritten.current = q;
    const urlTab = parseTab(searchParams.get("tab"));
    const urlLocale = parseLocale(searchParams.get("lang"));
    const urlInputs = inputsFromSearchParams(searchParams);
    const canonical = searchParamsFromState(urlTab, urlInputs, urlLocale).toString();
    setTab((prev) => (prev === urlTab ? prev : urlTab));
    setLocale((prev) => (prev === urlLocale ? prev : urlLocale));
    setInputs((prev) =>
      searchParamsFromState(urlTab, prev, urlLocale).toString() === canonical ? prev : urlInputs,
    );
  }, [searchParams]);

  useEffect(() => {
    const next = searchParamsFromState(tab, inputs, locale).toString();
    if (next === lastWritten.current) return;
    const prev = new URLSearchParams(lastWritten.current ?? "");
    const tabOrLang =
      parseTab(prev.get("tab")) !== tab || parseLocale(prev.get("lang")) !== locale;
    const id = window.setTimeout(() => {
      lastWritten.current = next;
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }, tabOrLang ? 0 : 200);
    return () => window.clearTimeout(id);
  }, [tab, inputs, locale, pathname, router]);

  function patchInputs(patch: Partial<ModelInputs>) {
    setInputs((prev) => clampInputs({ ...prev, ...patch }));
  }

  function patchSku(skuId: SkuId, patch: Partial<SkuInputs>) {
    setInputs((prev) => {
      const key = SKU_STATE_KEY[skuId];
      return clampInputs({ ...prev, [key]: { ...prev[key], ...patch } });
    });
  }

  function patchFacility(patch: Partial<Gb300Facility>) {
    setInputs((prev) =>
      clampInputs({
        ...prev,
        gb300Facility: { ...(prev.gb300Facility ?? DEFAULT_INPUTS.gb300Facility), ...patch },
      }),
    );
  }

  function reset() {
    setInputs(
      clampInputs({
        ...DEFAULT_INPUTS,
        sku5090: { ...DEFAULT_INPUTS.sku5090, bom: cloneBom(DEFAULT_INPUTS.sku5090.bom) },
        skuPro6000: { ...DEFAULT_INPUTS.skuPro6000, bom: cloneBom(DEFAULT_INPUTS.skuPro6000.bom) },
        skuGb300: { ...DEFAULT_INPUTS.skuGb300, bom: cloneBom(DEFAULT_INPUTS.skuGb300.bom) },
        gb300Facility: { ...DEFAULT_INPUTS.gb300Facility },
      }),
    );
  }

  if (!ready) {
    return (
      <LocaleProvider locale={locale}>
        <AppLoading />
      </LocaleProvider>
    );
  }

  return (
    <LocaleProvider locale={locale}>
      <RoiShell
        tab={tab}
        setTab={setTab}
        locale={locale}
        setLocale={setLocale}
        inputs={inputs}
        result={result}
        reset={reset}
        patchInputs={patchInputs}
        patchSku={patchSku}
        patchFacility={patchFacility}
      />
    </LocaleProvider>
  );
}

function AppLoading() {
  const { t } = useT();
  return <main className="p-6 text-sm text-muted-foreground">{t("loading")}</main>;
}

function RoiShell({
  tab,
  setTab,
  locale,
  setLocale,
  inputs,
  result,
  reset,
  patchInputs,
  patchSku,
  patchFacility,
}: {
  tab: TabId;
  setTab: (tab: TabId) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  inputs: ModelInputs;
  result: ReturnType<typeof runModel>;
  reset: () => void;
  patchInputs: (patch: Partial<ModelInputs>) => void;
  patchSku: (skuId: SkuId, patch: Partial<SkuInputs>) => void;
  patchFacility: (patch: Partial<Gb300Facility>) => void;
}) {
  const { t } = useT();
  const tabClass =
    "h-8 flex-none rounded-none rounded-t-md border border-transparent bg-primary/10 px-3.5 text-sm hover:bg-primary/15 data-active:border-border data-active:border-b-transparent data-active:bg-background data-active:text-foreground data-active:shadow-[inset_0_2px_0_0_var(--primary)]";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value === "string") setTab(parseTab(value));
        }}
      >
        <div className="grid gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-xl font-medium tracking-tight">{t("title")}</h1>
            <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
              <LanguageToggle locale={locale} onChange={setLocale} />
              <Button variant="outline" size="sm" onClick={reset}>
                {t("reset")}
              </Button>
            </div>
          </div>
          <TabsList
            className="h-auto w-full min-w-0 justify-start gap-px overflow-x-auto rounded-none bg-muted p-0 pt-1 group-data-horizontal/tabs:h-auto"
            aria-label={t("section")}
          >
            <TabsTrigger className={tabClass} value="5090">
              RTX 5090
            </TabsTrigger>
            <TabsTrigger className={tabClass} value="pro6000">
              Pro 6000
            </TabsTrigger>
            <TabsTrigger className={tabClass} value="compare">
              {t("compare")}
            </TabsTrigger>
            <TabsTrigger className={tabClass} value="gb300">
              GB300
            </TabsTrigger>
          </TabsList>
          <ChromeBar
            tab={tab}
            inputs={inputs}
            onChange={patchInputs}
            onSkuChange={patchSku}
            onFacilityChange={patchFacility}
          />
        </div>
        <TabsContent className="pt-6" value="5090">
          <GpuTab skuId="5090" inputs={inputs} result={result.sku5090} onSkuChange={patchSku} />
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
          <CompareTab inputs={inputs} sku5090={result.sku5090} skuPro6000={result.skuPro6000} />
        </TabsContent>
        <TabsContent className="pt-6" value="gb300">
          <GpuTab skuId="gb300" inputs={inputs} result={result.skuGb300} onSkuChange={patchSku} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
