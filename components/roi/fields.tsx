"use client";

import { createContext, useContext, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { clamp } from "@/lib/roi/finance";
import { usd } from "@/lib/roi/format";
import { cn } from "@/lib/utils";

const FieldIdContext = createContext<string | undefined>(undefined);
const FieldRowContext = createContext(false);

export function useFieldId() {
  return useContext(FieldIdContext);
}

/** Shared label / control rows so side-by-side fields stay flush. */
export function FieldRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <FieldRowContext.Provider value={true}>
      <div className={cn("grid gap-4 sm:grid-rows-[auto_auto] sm:gap-y-1.5", className)}>
        {children}
      </div>
    </FieldRowContext.Provider>
  );
}

export function Field({
  label,
  hint,
  caption,
  extra,
  children,
  className,
  emphasis = false,
  onLabelDoubleClick,
}: {
  label: string;
  hint?: string;
  caption?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  emphasis?: boolean;
  onLabelDoubleClick?: () => void;
}) {
  const id = useId();
  const inRow = useContext(FieldRowContext);
  return (
    <FieldIdContext.Provider value={id}>
      <div
        className={cn(
          "grid content-start gap-1.5",
          inRow && "sm:row-span-2 sm:grid-rows-subgrid",
          className,
        )}
        onDoubleClick={onLabelDoubleClick}
      >
        <div className="flex min-h-6 items-center justify-between gap-2">
          <div className="flex min-h-6 items-center gap-1.5">
            <Label
              htmlFor={id}
              className={emphasis ? undefined : "text-xs text-muted-foreground"}
            >
              {label}
            </Label>
            {extra}
            {emphasis && extra == null ? (
              <span className="inline-block h-6 shrink-0" aria-hidden />
            ) : null}
          </div>
          {hint ? <span className="font-mono text-xs text-muted-foreground">{hint}</span> : null}
        </div>
        <div className="grid min-w-0 content-start gap-1.5">
          {children}
          {caption ? (
            <span className="font-mono text-xs text-muted-foreground">{caption}</span>
          ) : null}
        </div>
      </div>
    </FieldIdContext.Provider>
  );
}

function commitNumber(
  raw: string,
  min: number | undefined,
  max: number | undefined,
): number | undefined {
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return clamp(n, min ?? Number.NEGATIVE_INFINITY, max ?? Number.POSITIVE_INFINITY);
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const id = useFieldId();
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (Number.isFinite(value) ? String(value) : "");

  function apply(raw: string) {
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
      setDraft(raw);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setDraft(raw);
      return;
    }
    const lo = min ?? Number.NEGATIVE_INFINITY;
    const hi = max ?? Number.POSITIVE_INFINITY;
    if (n < lo || n > hi) {
      setDraft(raw);
      return;
    }
    onChange(n);
    setDraft(raw === String(n) ? null : raw);
  }

  return (
    <Input
      id={id}
      type="number"
      className={cn("font-mono h-8 tabular-nums", className)}
      value={display}
      min={min}
      max={max}
      step={step}
      onChange={(e) => apply(e.target.value)}
      onBlur={() => {
        if (draft != null) {
          const next = commitNumber(draft, min, max);
          if (next != null) onChange(next);
        }
        setDraft(null);
      }}
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  min,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  const id = useFieldId();
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? usd(value, 0);

  function parse(raw: string): number | undefined {
    const n = Number(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      className="h-8 font-mono tabular-nums"
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const n = parse(raw);
        if (n == null) return;
        if (min != null && n < min) return;
        onChange(n);
      }}
      onBlur={() => {
        if (draft != null) {
          const n = parse(draft);
          if (n != null) onChange(clamp(n, min ?? 0, Number.POSITIVE_INFINITY));
        }
        setDraft(null);
      }}
    />
  );
}

export function TextInput({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  const id = useFieldId();
  return (
    <Input
      id={id}
      className="h-8"
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function PercentInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.01,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="relative">
      <NumberInput
        className="pr-7"
        value={Number(value * 100)}
        min={min}
        max={max}
        step={step}
        onChange={(n) => onChange(n / 100)}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center font-mono text-xs text-muted-foreground">
        %
      </span>
    </div>
  );
}

export function SwitchField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
