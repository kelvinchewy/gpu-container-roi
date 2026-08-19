"use client";

import { useRef } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Locale } from "@/lib/roi/i18n";
import { cn } from "@/lib/utils";

import { useT } from "./locale";

const OPTIONS: { id: Locale; label: string; tip: string }[] = [
  { id: "en", label: "EN", tip: "English" },
  { id: "zh", label: "中文", tip: "简体中文" },
];

export function LanguageToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  const { t } = useT();
  const refs = useRef<Partial<Record<Locale, HTMLElement | null>>>({});

  function select(next: Locale) {
    onChange(next);
    queueMicrotask(() => refs.current[next]?.focus());
  }

  function move(delta: number) {
    const i = OPTIONS.findIndex((o) => o.id === locale);
    const next = OPTIONS[(i + delta + OPTIONS.length) % OPTIONS.length];
    if (next) select(next.id);
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("langToggle")}
      className="inline-flex h-8 shrink-0 rounded-lg bg-muted p-[3px]"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          select("en");
        } else if (e.key === "End") {
          e.preventDefault();
          select("zh");
        }
      }}
    >
      {OPTIONS.map((opt) => {
        const checked = locale === opt.id;
        return (
          <Tooltip key={opt.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={opt.tip}
                  tabIndex={checked ? 0 : -1}
                  ref={(el) => {
                    refs.current[opt.id] = el;
                  }}
                  className={cn(
                    "inline-flex h-full min-w-9 items-center justify-center rounded-md border border-transparent px-2.5 text-sm font-medium outline-none select-none",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    checked
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => select(opt.id)}
                />
              }
            >
              {opt.label}
            </TooltipTrigger>
            <TooltipContent>{opt.tip}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
