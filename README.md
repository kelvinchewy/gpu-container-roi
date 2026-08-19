# GPU Container ROI

Underwriting tool for a containerized AI data center.

**Read [AGENTS.md](AGENTS.md) first.** That file is the contract. Readable twin: [Notion GPU Container ROI](https://app.notion.com/p/hashing/5090-6000-3be1a6d49e8f801d9d11ed4b65ac29cc). Git wins if they disagree.

Four tabs: **RTX 5090** · **Pro 6000** · **Compare** · **GB300**.

## Integrity

The public repo is **code and golden tests only**. The Excel workbook and PPT stay local and are gitignored. `lib/roi/engine.ts` is the calculator. `npm test` pins Excel Atlanta ScenA cached values (CapEx, IRR, NPV, payback).

BOM is editable on the **RTX 5090** and **Pro 6000** tabs only. GB300 is a single rack price. Compare has a numeric server price.

## Run

```
npm install
npm test
npm run dev
```

Open `/` (default tab RTX 5090). `?tab=pro6000` · `?tab=compare` · `?tab=gb300`. `?lang=zh` for Simplified Chinese.

Next.js · TypeScript · Tailwind v4 · shadcn/ui · Recharts. Client-side engine, no auth.
