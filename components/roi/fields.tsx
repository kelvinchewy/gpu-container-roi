"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  extra,
  children,
  className,
  onLabelDoubleClick,
}: {
  label: string;
  hint?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onLabelDoubleClick?: () => void;
}) {
  return (
    <div
      className={cn("grid gap-1.5", className)}
      onDoubleClick={onLabelDoubleClick}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Label
            className="text-xs text-muted-foreground"
          >
            {label}
          </Label>
          {extra}
        </div>
        {hint ? <span className="font-mono text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
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
  return (
    <Input
      type="number"
      className={cn("font-mono h-8 tabular-nums", className)}
      value={Number.isFinite(value) ? value : ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = e.target.valueAsNumber;
        if (Number.isFinite(n)) onChange(n);
      }}
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
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
