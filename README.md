# GPU Container ROI

Internal underwriting tool for a containerized AI data center.

**Read [AGENTS.md](AGENTS.md) first.** That file is the contract.

Four tabs: **RTX 5090** · **Pro 6000** · **Compare** · **Context**.

## Source files

| File | Role |
| --- | --- |
| `GPU_ROI_Model_5090_Atlanta_v5_ScenA.xlsx` | Canonical engine (Atlanta ScenA) |
| `GPU-ROI-Analysis-RTX5090-Pro6000-v2-CN.pptx` | Context tab BOM only (not financial totals) |

Excel and the deck disagree on several numbers. The app must follow Excel.

## Run

```
npm install
npm test
npm run dev
```

Open `/` (default tab RTX 5090). `?tab=pro6000` · `?tab=compare` · `?tab=context`.

Next.js · TypeScript · Tailwind v4 · shadcn/ui · Recharts. Client-side engine, no auth.

EcoHash list prices on Context are comps only. Not a second P&L. Engine stays Excel.
