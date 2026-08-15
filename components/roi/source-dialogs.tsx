"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SKU_LABEL } from "@/lib/roi/defaults";
import { usd } from "@/lib/roi/format";
import { RENT_SOURCE, bomSum, cloneBom, type BomLine } from "@/lib/roi/sources";
import type { SkuId } from "@/lib/roi/types";

import { NumberInput } from "./fields";

export function ServerBomDialog({
  skuId,
  lines,
  open,
  onOpenChange,
  onSave,
}: {
  skuId: SkuId;
  lines: BomLine[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lines: BomLine[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(Boolean(next))}>
      {open ? (
        <BomEditor
          skuId={skuId}
          lines={lines}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  );
}

function BomEditor({
  skuId,
  lines,
  onOpenChange,
  onSave,
}: {
  skuId: SkuId;
  lines: BomLine[];
  onOpenChange: (open: boolean) => void;
  onSave: (lines: BomLine[]) => void;
}) {
  const [draft, setDraft] = useState<BomLine[]>(() => cloneBom(lines));

  function patch(key: string, field: "qty" | "unitPrice", value: number) {
    setDraft((prev) =>
      prev.map((line) => (line.key === key ? { ...line, [field]: value } : line)),
    );
  }

  const total = bomSum(draft);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{SKU_LABEL[skuId]} server BOM</DialogTitle>
        <DialogDescription>Save writes server price.</DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit $</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {draft.map((line) => (
            <TableRow key={line.key}>
              <TableCell>{line.item}</TableCell>
              <TableCell className="w-24">
                <NumberInput
                  value={line.qty}
                  min={0}
                  step={1}
                  onChange={(qty) => patch(line.key, "qty", qty)}
                />
              </TableCell>
              <TableCell className="w-32">
                <NumberInput
                  value={line.unitPrice}
                  min={0}
                  step={50}
                  onChange={(unitPrice) => patch(line.key, "unitPrice", unitPrice)}
                />
              </TableCell>
              <TableCell className="text-right font-mono">
                {usd(line.qty * line.unitPrice)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="text-right font-mono">{usd(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave(cloneBom(draft));
            onOpenChange(false);
          }}
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function RentSourceDialog({
  skuId,
  modelRent,
  open,
  onOpenChange,
}: {
  skuId: SkuId;
  modelRent: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const row = RENT_SOURCE[skuId];
  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(Boolean(next))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{SKU_LABEL[skuId]} GPU rent</DialogTitle>
          <DialogDescription>Market comps as of Aug 2026.</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Series</TableHead>
              <TableHead className="text-right">$/GPU-hr</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell className="text-right font-mono">${modelRent.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>EcoHash</TableCell>
              <TableCell className="text-right font-mono">{row.ecohash}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>PPT adopted</TableCell>
              <TableCell className="text-right font-mono">{row.adoptedPpt}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Market low</TableCell>
              <TableCell className="text-right font-mono">{row.low}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Market mid</TableCell>
              <TableCell className="text-right font-mono">{row.mid}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Market high</TableCell>
              <TableCell className="text-right font-mono">{row.high}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-xs text-muted-foreground">
                {row.sources}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
