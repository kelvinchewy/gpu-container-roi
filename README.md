# GPU Container ROI

Underwriting tool for a containerized AI data center.

**Read [AGENTS.md](AGENTS.md) first.** That file is the contract.

Four tabs: **RTX 5090** · **Pro 6000** · **Compare** · **Research**.

## Integrity

The public repo is **code and golden tests only**. The Excel workbook and PPT stay local and are gitignored. `lib/roi/engine.ts` is the calculator. `npm test` pins Excel Atlanta ScenA cached values (CapEx, IRR, NPV, payback). Research `$` are listed comps with public URLs; they do not feed the engine.

BOM is editable on the **RTX 5090** and **Pro 6000** tabs only. Compare has a numeric server price. Research has no BOM.

## Run

```
npm install
npm test
npm run dev
```

Open `/` (default tab RTX 5090). `?tab=pro6000` · `?tab=compare` · `?tab=research`.

Next.js · TypeScript · Tailwind v4 · shadcn/ui · Recharts. Client-side engine, no auth.
