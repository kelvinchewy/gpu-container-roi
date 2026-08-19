"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { t as translate, type Locale, type MsgKey } from "@/lib/roi/i18n";

type LocaleCtx = {
  locale: Locale;
  t: (key: MsgKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  t: (key, vars) => translate("en", key, vars),
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT(): LocaleCtx {
  return useContext(LocaleContext);
}
