# AGENTS.md — GPU Container ROI

This is the project contract. Cursor loads this file the way Claude Code loads `CLAUDE.md`. Read it before changing product, copy, or the engine. Do not invent a parallel spec.

**Working title:** GPU Container ROI
**Audience:** English-speaking project managers underwriting a containerized AI data center.
**Job:** Four tabs. **RTX 5090** · **Pro 6000** · **Compare** · **GB300**. GPU tabs: inputs, KPIs, charts, matrix for one SKU. Compare is 5090 vs Pro 6000 only. No marketing copy.

---

## Northstar decisions

- **Excel is the calculator.** Port formulas from the local workbook `GPU_ROI_Model_5090_Atlanta_v5_ScenA.xlsx` (sheets `ROI Model 5090` and `ROI Model pro 6000`). Do not invent math. The workbook and PPT are **not** in git; golden tests in `lib/roi/engine.test.ts` are the public pin.
- **The PPT is not a public source.** Hardware BOM lives on GPU tabs 5090 and Pro 6000 only. GB300 BOM is a single rack price. **Never use PPT financial totals.** No prose paragraphs in the UI.
- **Deal (one line, on chrome chip):** Owner-operator · 100% of GPU-hour rent · EcoHash deploys · unlevered. Not a colo waterfall.
- **Access:** internal, no auth. Do not submit the Vercel URL to public directories.
- **Language:** Default English. Segmented **EN | 中文** in the header. `?lang=zh` is Simplified Chinese UI; omit when English. No `/zh` route. Engine, goldens, URL keys, SKU names, OBBBA/PUE/IRR/NPV/CapEx/NCF, and USD stay English. User-typed site names are not translated.
- **UI:** one page, four tabs. Stock shadcn. No custom CSS campaign. No Dashboard/Brief/Story/Lab names.
- **Notion twin:** [GPU Container ROI](https://app.notion.com/p/hashing/5090-6000-3be1a6d49e8f801d9d11ed4b65ac29cc) is a readable twin for people and other agents. **This file wins if they disagree.**

---

## Source of truth

| Source | Use for | Do not use for |
| --- | --- | --- |
| Excel v5 Atlanta ScenA | Engine, defaults, golden tests | UI copy |
| PPT v2 CN | — (not used) | Capex, rent, util, PUE, payback, IRR, NPV |
| EcoHash URLs | Rent-source dialog citations | A second P&L |

Excel and PPT disagree. Examples for RTX 5090:

| Assumption | Excel (canonical) | PPT (ignore for engine) |
| --- | --- | --- |
| Server price | $88,200 | $60,000 |
| GPU rent | $0.63 / GPU-hr | $0.60 |
| Utilization | 100% | 95% |
| PUE | 1.3 | 1.15 |
| Power | $60 / kW-month | $0.06 / kWh |
| Total capex | $3.687M | $2.70M |

Tabs 1–4 render **live Excel-engine output** (GB300 uses the same formulas, rack topology). BOM is editable on tabs 1–2 only; GB300 is rack price.

---

## Product shape

Four tabs, one engine. Switching tabs does not reset inputs. Air-box fields update 5090 and Pro 6000 only. `gb300Facility` updates GB300 only. Discount rate and price decay update all SKUs. Per-SKU fields never copy across SKUs.

| Tab | Name in UI | What it is |
| --- | --- | --- |
| 1 | **RTX 5090** (default) | Inputs, KPIs, charts, matrix for this GPU. |
| 2 | **Pro 6000** | Same layout as tab 1, other GPU. |
| 3 | **Compare** | 5090 vs Pro 6000 only. Overlay chart, readout, delta table. No GB300. |
| 4 | **GB300** | Same layout as tabs 1–2. NVL72 rack (Blackwell Ultra + Grace), not Vera Rubin. |

Query `?tab=5090|pro6000|compare|gb300` (default `5090`). `?lang=zh` for Simplified Chinese (omit when `en`). Legacy `?tab=research` or `?tab=context` opens 5090.

```
EditableInputs → lib/roi/engine.ts → shared state → all tabs
```

There is **no SKU toggle** and **no Dashboard/Brief/Story/Lab**. Tabs 1, 2, and 4 *are* the SKUs.

### Chrome

Compact bar above the tab strip:

- Title `GPU Container ROI`
- **Investor (shared across SKUs):** discount rate, price decay switch + rate
- **Air-box accordion (5090 / Pro 6000 / Compare only):** power `$/kWh`, site, tax, 35×8 topology, capex/opex rates. Per-GPU IT load and residual for 5090 and Pro 6000 only.
- **GB300 facility (GB300 tab only):** same chrome layout and `p-4` well as 5090 / Pro 6000. Power binds `gb300Facility.elecPerKwh`. Accordion is GB300-only (site, tax, NVL72 topology). Light `primary/5` fill on that well — no extra border box. No 35×8. No crossover with air-box fields.
- Reset

Discount and price decay update all SKUs. Site, tax, topology, power tariff, and capex/opex rates on the GB300 tab never write to 5090 / Pro 6000, and vice versa.

IT load and residual for 5090 / Pro 6000 sit in the air-box accordion under **Per GPU**. GB300 IT is kW/rack and residual live in the GB300 accordion under **Per rack**. GPUs / rack sits on the GB300 primary card with rack price and racks (same sold-unit row).

### GPU workbench (5090, Pro 6000, GB300)

Per-SKU inputs: 5090 / Pro 6000 = server price, then GPU rent + utilization on the next row. GB300 = rack price + racks + GPUs / rack, then server rent ($/server-hr) + utilization. Cost and rent are never on the same line. Field labels only.

Order, top to bottom:

1. Per-SKU primary inputs
2. KPI strip — CapEx, Y1 NCF, Payback (yrs), IRR, NPV, Breakeven month
3. Combined P&L + cumulative — Y0–Yn. Title: `P&L and cumulative NCF ($)`. Caption: `{SKU} · {site} · tax · topology · PUE · OBBBA on/off · decay on/off`. GB300 caption: `GB300 · NVL72 · Blackwell Ultra · … · {n} racks`.
4. Sensitivity matrix — utilization × price decay, cell = breakeven month
5. Yearly P&L + cash-flow table, **open by default**. Optional OpEx stacked bar inside. No inner tab strip.

Do not put the other SKU on these tabs.

**GB300 topology (does not use 35 × 8):** one sold unit = one NVL72 rack = 72 GPUs. Reset: 24 racks × $5.0M × 140 kW IT × **$720/server-hr** (`$10/GPU-hr × 72`). `totalServers = rackCount`. Infra = `(gb300Facility.containerCost + siteConstruction) × hallCount` (Reset `$0` + `$58M`). Not Vera Rubin. Compare chrome stays the air-box accordion.

### Tab 3 — Compare

1. Two readout columns — 5090 | Pro 6000 (server price, rent, utilization) from the GPU tabs. Not editable here. Shared chrome still applies.
2. KPI delta table — Pro 6000 − 5090 for CapEx, Y1 NCF, Payback, IRR, NPV, Residual (Y5), breakeven month.
3. **Returns** table — cash-on-cash, total ROI, MOIC (Excel C75 / C80 / C87). Cash-on-cash = mean operating NCF / CapEx. MOIC includes residual.
4. **Tax path** table — Year × Dep / EBIT / Tax / NOL for both SKUs. Makes OBBBA vs SL visible (Y1 bonus = depreciable basis).
5. **Unit economics** table — Y1 per GPU (revenue, OpEx, NCF, CapEx) and per facility kW (revenue, NCF). kW = IT × PUE.
6. **OpEx** table — Y1 electricity, network, O&M, insurance, property tax, other. Electricity follows IT load; insurance/other follow rent; property tax follows capex.
7. Overlay cumulative cash (two lines, zero line). Title: `Cumulative NCF ($)`
8. No matrices. No “winner” sentence. Sign on delta shows who is better on that metric.

### KPI strip (5090, Pro 6000, GB300)

Total CapEx · Y1 NCF · Payback (yrs) · IRR (with residual) · NPV · **Residual (Y5)** · **Breakeven month**.

Follows `obbbaEnabled` and the with-residual series. Breakeven month = `ceil(paybackYears × 12)`. Still negative at year N → `—`.

---

## Field contract

Almost every assumption is editable. Frequency is a UX grouping, not a hard lock. Defaults = Excel ScenA except GPU rent (`$0.63` / `$1.73`) and power `$0.06/kWh`. GB300 Reset is not Excel: rack `$5.0M` · **`$720/server-hr`** (`$10/GPU-hr × 72`) · 24 racks · 72 GPUs · 140 kW · container `$0` · site `$58M`. Out-of-bounds values clamp. Per-SKU fields never copy across SKUs. Air-box shared fields update 5090 and Pro 6000 only. `gb300Facility` updates GB300 only. Discount rate and price decay update all SKUs.

URL search params serialize A + B + C + `g_*` facility + view toggles + `lang=zh`. Missing params = defaults. Legacy GB300 `c_rent` ≤ 50 with no `c_ru=s` is $/GPU-hr and is multiplied by GPUs/rack. New writes set `c_ru=s` so `$50/server-hr` is not migrated.

### A — Primary

**Shared (chrome, 5090 / Pro 6000 / Compare):**

| Key | Label | Default | Bounds |
| --- | --- | --- | --- |
| `elecPerKwh` | Power ($/kWh) | `$0.06` | 0.02–0.25 |
| `discountRate` | Discount rate (NPV) | `10%` | 5–20% |
| `priceErosionOn` | Apply price erosion | `off` | boolean |
| `priceErosionRate` | Erosion rate | `10%/yr` | 0–25% |

On the **GB300** tab, power binds `gb300Facility.elecPerKwh` × GB300 PUE. Discount and decay stay the investor fields above.

Show **effective** `$/kWh` next to power: `elecPerKwh × pue`. Input is tariff `$/kWh`. Default `$0.06` (PPT-style). Excel ScenA `$60/kW-month` = `$0.0822/kWh`. Erosion default **off**. Show `priceErosionRate` only when erosion is on.

**Per SKU (5090, Pro 6000, GB300):**

| Key | Label | 5090 | Pro 6000 | GB300 | Bounds |
| --- | --- | --- | --- | --- | --- |
| `serverPrice` | Server / rack price | `$88,200` | `$191,800` | `$5,000,000` | > 0 |
| `gpuRentPerHr` | GPU rent ($/GPU-hr) · GB300 Server rent ($/server-hr) | `$0.63` | `$1.73` | `$720` | 0.01–50 · GB300 0.01–5000 |
| `utilization` | Utilization | `100%` | `100%` | `100%` | 40–100% |
| `rackCount` | Racks | — | — | `24` | 1–64 integer |
| `gpusPerServer` | GPUs / rack | — (uses shared 8) | — | `72` | 1–128 on GB300 |

### B — Rarely touched (accordion in chrome)

**Site & tax** — how another state is modeled. No 50-state dropdown. 5090 / Pro 6000 / Compare use the air-box keys. GB300 uses `gb300Facility.*` (same defaults, separate store). URL prefix `g_`.

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `siteName` | `Atlanta, GA` | air-box | text |
| `federalTax` | `21%` | air-box | 0–35% |
| `stateTax` | `5.75%` | air-box | 0–15% |
| `propertyTaxPctCapex` | `1%` | air-box | 0–5% |
| `obbbaEnabled` | `on` | air-box | boolean |

`combinedTax` is derived: `1 - (1 - federalTax) * (1 - stateTax)` = **25.5425%** at defaults. Show as a chip under the two tax inputs. Never a third tax slider.

**Depreciation is this one checkbox.** No separate SL / OBBBA view toggle. No with / without residual toggle. Headline KPIs always include residual cash in the final year. `residualPct` is the lever (set to 0 to drop exit value). Infra is never in residual (Excel C85 = server capex × residual only).

- **OBBBA off:** straight-line to residual. Depreciable basis = `serverCapex × (1 − residualPct)`. Annual dep = basis / `usefulLifeYrs`. Tax from EBIT = EBITDA − that dep. Level NCF each operating year. Final year adds residual cash = `serverCapex × residualPct`.
- **OBBBA on (Atlanta default):** 100% bonus in year 1 on the same depreciable basis, NOL carryforward, 80% taxable-income limit (Excel rows 117–133). Final year still adds residual cash.

**Topology & power**

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `containerCount` | `1` | air-box | 1–20 integer |
| `serversPerContainer` | `35` | air-box | 1–64 integer |
| `gpusPerServer` | `8` | air-box (5090 / Pro 6000) | 1–8 integer |
| `itLoadKw` | 5090 `6.8` / Pro 6000 `6.3` / GB300 `140` | per SKU | 0.5–500 |
| `pue` | `1.3` | air-box | 1.05–1.6 |
| `hoursPerYear` | `8760` | air-box | 8000–8784 |
| `hallCount` | `1` | GB300 facility | 1–20 integer |

`containerCount` scales the Excel single-container model linearly (capex, GPUs, power, per-container opex) for 5090 / Pro 6000. GB300 uses `rackCount` for GPUs and `hallCount` for infra / network / O&M.

**Capex & opex extras**

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `containerCost` | air-box `$400,000` · GB300 `$0` | air-box; copy on `gb300Facility` | ≥ 0 |
| `siteConstruction` | air-box `$200,000` · GB300 `$58,000,000` | air-box; copy on `gb300Facility` | ≥ 0 |
| `networkOpexMo` | `$3,750` | air-box; copy on `gb300Facility` | ≥ 0 |
| `omOpexMo` | `$2,500` | air-box; copy on `gb300Facility` | ≥ 0 |
| `insurancePctRev` | `3%` | air-box; copy on `gb300Facility` | 0–10% |
| `otherOpexPctRev` | `1%` | air-box; copy on `gb300Facility` | 0–10% |
| `residualPct` | `10%` | per SKU | 0–30% |
| `usefulLifeYrs` | `5` | air-box; copy on `gb300Facility` | 5090 / Pro 6000 3–5 · GB300 3–10 |

### C — Not inputs

Do not render as inputs. Do not put in the URL.

| Item | Why |
| --- | --- |
| Currency USD | Product scope |
| Unlevered (no debt engine) | Excel has no debt |
| Combined tax **formula** | Identity — rates in B are the levers |
| OBBBA **mechanics** when enabled | Tax law: 100% Y1 bonus on depreciable basis, NOL, 80% limit |
| All derived outputs | Compute only |

### D — Derived (never store as inputs)

```
combinedTax      = 1 - (1 - federalTax) * (1 - stateTax)
totalServers     = rackCount ?? containerCount * serversPerContainer
totalGpus        = totalServers * (sku.gpusPerServer ?? shared gpusPerServer)
infraCapex       = (containerCost + siteConstruction) * scaleCount
                 // 5090 / Pro 6000: scaleCount = containerCount
                 // GB300: scaleCount = gb300Facility.hallCount; $ from gb300Facility
serverCapex      = totalServers * serverPrice
totalCapex       = serverCapex + infraCapex
itLoadTotalKw    = totalServers * itLoadKw
totalPowerKw     = itLoadTotalKw * pue
effectiveKwh     = elecPerKwh * pue
```

5090 / Pro 6000 default: 35 × 8 = 280 GPUs. GB300 Reset: 24 × 72 = 1,728 GPUs. GB300 `pue` / `elecPerKwh` / tax come from `gb300Facility`.

Also derived: revenue, each OpEx line, EBITDA, depreciation, EBIT, tax, NCF, per-GPU, per-kW, cash flows Y0–Yn, cumulative, breakeven year, cash-on-cash, payback, ROI, MOIC, IRR, NPV, OBBBA year-by-year NOL / taxable income / NCF.

### E — View toggles (not model inputs)

- Top tab: `5090` | `pro6000` | `compare` | `gb300`
- Depreciation follows `obbbaEnabled`, not a view toggle

---

## Engine

File: `lib/roi/engine.ts`. Signature: `runModel(inputs) → { sku5090, skuPro6000, skuGb300 }`. Client-side only. No backend.

### Must-match formulas (Excel)

```
revenue     = billedUnits * gpuRentPerHr * hoursPerYear * utilization
            // 5090 / Pro 6000: billedUnits = totalGpus
            // GB300: billedUnits = totalServers (one rack = one server)
electricity = totalServers * itLoadKw * pue * elecPerKwh * hoursPerYear
network     = networkOpexMo * 12 * containerCount
om          = omOpexMo * 12 * containerCount
insurance   = revenue * insurancePctRev
propertyTax = totalCapex * propertyTaxPctCapex
otherOpex   = revenue * otherOpexPctRev
totalOpex   = electricity + network + om + insurance + propertyTax + otherOpex
ebitda      = revenue - totalOpex

depreciableBasis = serverCapex * (1 - residualPct)
residualCash     = serverCapex * residualPct          // servers only, year N
```

**Straight-line (OBBBA off)**

```
slDep = depreciableBasis / usefulLifeYrs
ebit  = ebitda - slDep
tax   = ebit * combinedTax
ncf   = ebitda - tax                  // level each operating year
```

Cash flow: Y0 = `−totalCapex`. Y1..Y(n-1) = `ncf`. Yn = `ncf + residualCash`.

**OBBBA on** — port Excel rows 117–133, do not simplify:

- Year 1 bonus takes `depreciableBasis` (not 100% of server capex).
- NOL carryforward; 80% of subsequent EBITDA may be offset while NOL remains.
- Tax = taxable income × `combinedTax`.
- NCF year t = EBITDA_t − tax_t.
- Final year still adds `residualCash`.

**Price erosion (only if `priceErosionOn`):** year t revenue = year-1 revenue × `(1 - priceErosionRate)^(t-1)`. Excel holds total OpEx at the Y1 amount (insurance / other do not step with eroded revenue). Rebuild the active path (SL or OBBBA) on that series.

**IRR / NPV / payback** — match Excel on the with-residual series of the active path. NPV at `discountRate` with Y0 undiscounted, Y1..Yn discounted. Payback from cumulative NCF crossing zero. Do not ship a homemade IRR that drifts from Excel.

**Returns (Excel C75 / C80 / C87)**

```
cashOnCash = mean(years.ncf) / totalCapex   // operating NCF; residual excluded
moic       = sum(cashFlows[1..n]) / totalCapex  // includes residual in year N
totalRoi   = moic - 1
```

**Unit economics (Excel C60–C63, C69–C70, Y1 active path)**

```
revenuePerGpu = Y1 revenue / totalGpus
opexPerGpu    = Y1 OpEx / totalGpus
ncfPerGpu     = Y1 NCF / totalGpus
capexPerGpu   = totalCapex / totalGpus
revenuePerKw  = Y1 revenue / totalPowerKw   // IT × PUE
ncfPerKw      = Y1 NCF / totalPowerKw
```

### Golden values

At ScenA topology (erosion off, residual 10%, 1 container). Fixture tests pin Excel rents (`$0.63` / `$1.94`) and Excel `$0.0822/kWh`. Product Reset uses `$0.63` / `$1.73` and `$0.06/kWh`.

**OBBBA on (Atlanta default)**

| | RTX 5090 | Pro 6000 |
| --- | --- | --- |
| Capex | $3,687,000 | $7,313,000 |
| Payback | 3.48 yrs | 1.86 yrs |
| IRR | 13.66% | 41.73% |
| NPV @ 10% | $344,342 | $6,361,070 |

Payback is cumulative NCF crossing zero. Excel 5090 cell B111 shows 3.52 because that sheet uses `3+cumY4/Y4` instead of the year-3 gap; Pro 6000 B111 matches this interpolation.

**OBBBA off (straight-line + residual)**

| | RTX 5090 | Pro 6000 |
| --- | --- | --- |
| Level NCF / yr | $997,309 | $3,445,964 |
| Payback | 3.70 yrs | 2.12 yrs |
| IRR | 12.87% | 38.60% |
| NPV @ 10% | $285,263 | $6,166,740 |
| Residual cash Y5 | $308,700 | $671,300 |

---

## Charts (required)

Three Recharts, reused. Do not invent a fourth type.

**GPU tab chart order:** cumulative line, then matrix, then revenue vs cost. Chart titles = metric names only.

| Chart | Type | Series | Where |
| --- | --- | --- | --- |
| Cumulative cash | Line | Cumulative NCF. Zero = breakeven. | GPU tabs, first chart. Compare = two lines. |
| Sensitivity | Heat matrix | Breakeven month | GPU tabs, under the cumulative line. Not on Compare. |
| Annual P&L | Grouped bar | Revenue, OpEx, NCF | GPU tabs, **after** the matrix. Compare optional small multiples. |
| OpEx stack | Stacked bar | Electricity, network, O&M, insurance, property tax, other | Inside the yearly-table disclosure only. |

Rules:

- X axis for time charts is **calendar years Y0/Y1…Yn** (Y0 capex is on the cumulative line only, not a revenue bar).
- When `priceErosionOn`, revenue bars step down; OpEx lines that are % of revenue step down with them.
- Caption every chart with SKU, site, OBBBA on/off, erosion on/off.
- One collapsed yearly table. **No inner tab strip.**
- No extra CSS. Default shadcn chart colors. `font-mono` on tick values.

## Sensitivity matrix (GPU tabs, under the cumulative chart)

Axes are **utilization × price decay**.

- **Columns (X):** utilization `60% · 70% · 80% · 90% · 100%`
- **Rows (Y):** price decay `0% · 5% · 10% · 15% · 20% · 25%` per year
- **Cell:** breakeven **month** (`ceil(paybackYears × 12)`), active path, with residual. Never-in-horizon = `—`
- Highlight the cell nearest this tab’s util + (`priceErosionOn ? priceErosionRate : 0`)
- Color: shorter month = better, longer / `—` = worse. shadcn token tints only.
- Tab 1 matrix = 5090 only. Tab 2 = Pro 6000 only. Tab 3 = GB300 only. **Compare has no matrix.**
- Caption: `Breakeven month · {SKU} · {site} · OBBBA on/off`

**Price decay** = Excel `priceErosionRate`. UI label: `Price decay (%/yr)`. No tokens-per-second model.

Each cell is a `runModel` call with that util and erosion rate (`priceErosionOn` true when decay > 0). 5 × 6 = 30 runs per SKU, client-side, no extra engine.

---

## Design

Keep it boring. Time spent on custom CSS is wasted.

- Stack: Next.js App Router + TypeScript + Tailwind v4 + **stock shadcn/ui** + Recharts (shadcn Chart if available).
- Components: `Tabs`, `Card`, `Input`, `Label`, `Slider`, `Switch`, `Select`, `Accordion`, `Table`, `Badge`, `Separator`, `Button`, `Tooltip`, `Chart`. If a widget is not in shadcn, use a table.
- Default shadcn tokens only. `font-mono` on numbers. No new palette, no extra fonts, no gradients, no motion libraries.
- UI copy = labels, units, footnotes. No paragraphs. No winner sentence.
- Copy: default US PM English (Excel labels). `?lang=zh` Simplified labels. SKU names, OBBBA/PUE/IRR/NPV/CapEx/NCF, and USD stay English. No PPT Chinese titles.

---

## v1 non-goals

Auth, saved accounts, live GPU-spot APIs, debt / leverage, PDF export, 50-state tax presets, utilization ramp, custom visual identity, animation, freight / customs / install, EcoHash fee line.

---

## Later

- Deploy-to-energize calendar / utilization ramp
- Debt module
- Live rental comps
- Vercel deployment protection if the URL leaks
- Named brand (header is `GPU Container ROI` until then)

---

## Vercel

Static-friendly: client-side engine, no required env vars for v1. Public code repo; do **not** commit the Excel or PPT. Golden tests pin Excel cached values.

When building the app, start from this file. If a later chat disagrees with Excel cached values, Excel wins.
