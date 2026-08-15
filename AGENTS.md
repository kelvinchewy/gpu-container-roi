# AGENTS.md — GPU Container ROI

This is the project contract. Cursor loads this file the way Claude Code loads `CLAUDE.md`. Read it before changing product, copy, or the engine. Do not invent a parallel spec.

**Working title:** GPU Container ROI
**Audience:** English-speaking project managers underwriting a containerized AI data center.
**Job:** Four tabs. Tabs 1–2: inputs, KPIs, charts, matrix for one GPU. Tab 3: 5090 vs Pro 6000. Tab 4: PPT facts as tables. No marketing copy.

---

## Northstar decisions

- **Excel is the calculator.** Port formulas from `GPU_ROI_Model_5090_Atlanta_v5_ScenA.xlsx` (sheets `ROI Model 5090` and `ROI Model pro 6000`). Do not invent math.
- **The PPT is Context tables only.** `GPU-ROI-Analysis-RTX5090-Pro6000-v2-CN.pptx` supplies BOM and market-source tables. **Never use its financial totals.** No prose paragraphs in the UI.
- **Deal (one line, on chrome chip):** Owner-operator · 100% of GPU-hour rent · EcoHash deploys · unlevered. Not a colo waterfall.
- **Access:** internal, no auth. Do not submit the Vercel URL to public directories.
- **Language v1: English only.** US PM English. Labels match Excel English (`Server price`, `Utilization`, `Payback`, `NPV`). No Chinese sublabels. A language switch or `/zh` is later.
- **UI:** one page, four tabs. Stock shadcn. No custom CSS campaign. No Dashboard/Brief/Story/Lab names.

---

## Source of truth

| Source | Use for | Do not use for |
| --- | --- | --- |
| Excel v5 Atlanta ScenA | Engine, defaults, golden tests | Context prose |
| PPT v2 CN | Context tab tables: BOM, market comps | Capex, rent, util, PUE, payback, IRR, NPV |
| EcoHash URLs | One link row on Context | A second P&L |

Excel and PPT disagree. Examples for RTX 5090:

| Assumption | Excel (canonical) | PPT (ignore for engine) |
| --- | --- | --- |
| Server price | $88,200 | $60,000 |
| GPU rent | $0.63 / GPU-hr | $0.60 |
| Utilization | 100% | 95% |
| PUE | 1.3 | 1.15 |
| Power | $60 / kW-month | $0.06 / kWh |
| Total capex | $3.687M | $2.70M |

Context tab is independent listed research (EcoHash vs market, PPT BOM, exclusions). It does not feed the engine unless the user explicitly asks. Tabs 1, 2, and 3 render **live Excel-engine output**.

---

## Product shape

Four tabs, one engine. Switching tabs does not reset inputs. Shared fields update both SKUs. Per-SKU fields never copy across SKUs.

| Tab | Name in UI | What it is |
| --- | --- | --- |
| 1 | **RTX 5090** (default) | Inputs, KPIs, charts, matrix for this GPU. |
| 2 | **Pro 6000** | Same layout as tab 1, other GPU. |
| 3 | **Compare** | Both SKUs, overlay chart, dual primary sliders, delta table. |
| 4 | **Context** | Independent listed comps (EcoHash vs market), PPT BOM, exclusions. Not the calculator. |

Query `?tab=5090|pro6000|compare|context` (default `5090`).

```
EditableInputs → lib/roi/engine.ts → shared state → all four tabs
```

There is **no SKU toggle** and **no Dashboard/Brief/Story/Lab**. Tabs 1 and 2 *are* the SKUs.

### Chrome (tabs 1, 2, 3 — not Context)

Compact bar above the tab strip:

- Title `GPU Container ROI`
- **Shared primary inputs:** power `$/kWh` (effective = rate × PUE), discount rate, price decay switch + rate (rate always visible)
- **Shared accordion:** site, tax, topology, capex/opex rates. Per-GPU IT load and residual (both SKUs).
- Reset

Shared controls appear **once** in chrome (power, discount, decay, plus the Site/tax/topology accordion). Changing them updates 5090, Pro 6000, and Compare.

IT load and residual are per-SKU and sit in that accordion under **Per GPU** (both SKUs always visible).

Context has no chrome inputs.

### Tabs 1 and 2 — GPU workbench (identical layout)

Per-SKU inputs: server price, GPU rent, utilization. Field labels only.

Order, top to bottom:

1. Per-SKU primary inputs
2. KPI strip — CapEx, Y1 NCF, Payback (yrs), IRR, NPV, Breakeven month
3. Combined P&L + cumulative — Y0–Yn. Title: `P&L and cumulative NCF ($)`. Caption: `{SKU} · {site} · tax · topology · PUE · OBBBA on/off · decay on/off`
4. Sensitivity matrix — utilization × price decay, cell = breakeven month
5. One collapsed disclosure: yearly P&L + cash-flow table. Optional OpEx stacked bar inside. No inner tab strip.

Do not put the other SKU on these tabs.

### Tab 3 — Compare

1. Two slim input columns — 5090 | Pro 6000 (server price, rent, utilization). Shared chrome still applies.
2. KPI delta table — Pro 6000 − 5090 for CapEx, Y1 NCF, Payback, IRR, NPV, Residual (Y5), breakeven month.
3. **Returns** table — cash-on-cash, total ROI, MOIC (Excel C75 / C80 / C87). Cash-on-cash = mean operating NCF / CapEx. MOIC includes residual.
4. **Tax path** table — Year × Dep / EBIT / Tax / NOL for both SKUs. Makes OBBBA vs SL visible (Y1 bonus = depreciable basis).
5. **Unit economics** table — Y1 per GPU (revenue, OpEx, NCF, CapEx) and per facility kW (revenue, NCF). kW = IT × PUE.
6. **OpEx** table — Y1 electricity, network, O&M, insurance, property tax, other. Electricity follows IT load; insurance/other follow rent; property tax follows capex.
7. Overlay cumulative cash (two lines, zero line). Title: `Cumulative NCF ($)`
8. No matrices. No “winner” sentence. Sign on delta shows who is better on that metric.

### Tab 4 — Context

Independent listed research. Tables and a bullet exclusion list. No paragraphs. Do **not** show calculator rents, Excel defaults, Reset, NPV, or IRR here. Do **not** feed these `$` into `runModel` unless the user explicitly asks.

1. Sold as — two-row unit table (bare metal `/GPU-hr` vs tokens `/M tok`)
2. Best for — one side-by-side job table (5090 | Pro 6000), paired with listing pie and cloud GPU $ mix pie (cite getdeploying + Dataintelo)
3. What the market pays — EcoHash vs listed GPU-hour (venue under each $); 5090 / Pro 6000 listed $/GPU-hr line only
4. How DeepSeek-V4-Flash bills — input vs output (OpenRouter $0.14/$0.28 · EcoHash $0.16/$0.33). Same unit · $/GPU-hr: two SKU rows. 5090 token/hr from measured 8×5090 full load (6,500 in / 1,500 out tok/s, agentic 10:1, $2.74/8 = $0.34). Pro 6000 token = —. Check only.
5. Exclusion list (bullets): no util ramp; no freight/customs/install; no EcoHash fee; Y1 = full year at stated util; unlevered; residual = servers only
6. Links row: ecohash.com · ecohash.com/pricing · colocation.ecohash.com · getdeploying · Dataintelo

No live P&L. No inputs.

### KPI strip (tabs 1, 2, 3)

Total CapEx · Y1 NCF · Payback (yrs) · IRR (with residual) · NPV · **Residual (Y5)** · **Breakeven month**.

Follows `obbbaEnabled` and the with-residual series. Breakeven month = `ceil(paybackYears × 12)`. Still negative at year N → `—`.

---

## Field contract

Almost every assumption is editable. Frequency is a UX grouping, not a hard lock. Defaults = Excel ScenA except GPU rent (`$0.63` / `$1.73`) and power `$0.06/kWh`. Out-of-bounds values clamp. Per-SKU fields never copy across SKUs. Shared fields update both SKUs.

URL search params serialize A + B + view toggles only. Missing params = defaults.

### A — Primary

**Shared (chrome, tabs 1, 2, 3 only):**

| Key | Label | Default | Bounds |
| --- | --- | --- | --- |
| `elecPerKwh` | Power ($/kWh) | `$0.06` | 0.02–0.25 |
| `discountRate` | Discount rate (NPV) | `10%` | 5–20% |
| `priceErosionOn` | Apply price erosion | `off` | boolean |
| `priceErosionRate` | Erosion rate | `10%/yr` | 0–25% |

Show **effective** `$/kWh` next to power: `elecPerKwh × pue`. Input is tariff `$/kWh`. Default `$0.06` (PPT-style). Excel ScenA `$60/kW-month` = `$0.0822/kWh`. Erosion default **off**. Show `priceErosionRate` only when erosion is on.

**Per SKU (GPU tabs 1–2, and two columns on Compare):**

| Key | Label | 5090 default | Pro 6000 default | Bounds |
| --- | --- | --- | --- | --- |
| `serverPrice` | Server price | `$88,200` | `$191,800` | > 0 |
| `gpuRentPerHr` | GPU rent ($/GPU-hr) | `$0.63` | `$1.73` | 0.01–10 |
| `utilization` | Utilization | `100%` | `100%` | 40–100% |

Context has no inputs.

### B — Rarely touched (accordion in chrome, tabs 1–3)

**Site & tax** — how another state is modeled. No 50-state dropdown.

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `siteName` | `Atlanta, GA` | shared | text |
| `federalTax` | `21%` | shared | 0–35% |
| `stateTax` | `5.75%` | shared | 0–15% |
| `propertyTaxPctCapex` | `1%` | shared | 0–5% |
| `obbbaEnabled` | `on` | shared | boolean |

`combinedTax` is derived: `1 - (1 - federalTax) * (1 - stateTax)` = **25.5425%** at defaults. Show as a chip under the two tax inputs. Never a third tax slider.

**Depreciation is this one checkbox.** No separate SL / OBBBA view toggle. No with / without residual toggle. Headline KPIs always include residual cash in the final year. `residualPct` is the lever (set to 0 to drop exit value). Infra is never in residual (Excel C85 = server capex × residual only).

- **OBBBA off:** straight-line to residual. Depreciable basis = `serverCapex × (1 − residualPct)`. Annual dep = basis / `usefulLifeYrs`. Tax from EBIT = EBITDA − that dep. Level NCF each operating year. Final year adds residual cash = `serverCapex × residualPct`.
- **OBBBA on (Atlanta default):** 100% bonus in year 1 on the same depreciable basis, NOL carryforward, 80% taxable-income limit (Excel rows 117–133). Final year still adds residual cash.

**Topology & power**

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `containerCount` | `1` | shared | 1–20 integer |
| `serversPerContainer` | `35` | shared | 1–64 integer |
| `gpusPerServer` | `8` | shared | 1–8 integer |
| `itLoadKw` | 5090 `6.8` / Pro 6000 `6.3` | per SKU | 0.5–20 |
| `pue` | `1.3` | shared | 1.05–1.6 |
| `hoursPerYear` | `8760` | shared | 8000–8784 |

`containerCount` scales the Excel single-container model linearly (capex, GPUs, power, per-container opex).

**Capex & opex extras**

| Key | Default | Shared? | Bounds |
| --- | --- | --- | --- |
| `containerCost` | `$400,000` | shared | ≥ 0 |
| `siteConstruction` | `$200,000` | shared | ≥ 0 |
| `networkOpexMo` | `$3,750` | shared | ≥ 0 |
| `omOpexMo` | `$2,500` | shared | ≥ 0 |
| `insurancePctRev` | `3%` | shared | 0–10% |
| `otherOpexPctRev` | `1%` | shared | 0–10% |
| `residualPct` | `10%` | per SKU | 0–30% |
| `usefulLifeYrs` | `5` | shared | 3–7 integer |

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
totalServers     = containerCount * serversPerContainer
totalGpus        = totalServers * gpusPerServer          // 280 at default
infraCapex       = (containerCost + siteConstruction) * containerCount
serverCapex      = totalServers * serverPrice
totalCapex       = serverCapex + infraCapex
itLoadTotalKw    = totalServers * itLoadKw
totalPowerKw     = itLoadTotalKw * pue
effectiveKwh     = elecPerKwh * pue
```

Also derived: revenue, each OpEx line, EBITDA, depreciation, EBIT, tax, NCF, per-GPU, per-kW, cash flows Y0–Yn, cumulative, breakeven year, cash-on-cash, payback, ROI, MOIC, IRR, NPV, OBBBA year-by-year NOL / taxable income / NCF.

### E — View toggles (not model inputs)

- Top tab: `5090` | `pro6000` | `context` | `compare`
- Depreciation follows `obbbaEnabled`, not a view toggle

---

## Engine

File: `lib/roi/engine.ts`. Signature: `runModel(inputs) → { sku5090, skuPro6000 }`. Client-side only. No backend.

### Must-match formulas (Excel)

```
revenue     = totalGpus * gpuRentPerHr * hoursPerYear * utilization
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
- Tab 1 matrix = 5090 only. Tab 2 = Pro 6000 only. **Compare has no matrix.**
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
- Copy: US PM English. Excel English labels. No PPT Chinese titles.

---

## v1 non-goals

Auth, saved accounts, live GPU-spot APIs, debt / leverage, PDF export, 50-state tax presets, utilization ramp, i18n / language switch, custom visual identity, animation, freight / customs / install, EcoHash fee line.

---

## Later

- Language switch or `/zh` (translate UI + Context; engine stays the same)
- Deploy-to-energize calendar / utilization ramp
- Debt module
- Live rental comps
- Vercel deployment protection if the URL leaks
- Named brand (header is `GPU Container ROI` until then)

---

## Vercel

Static-friendly: client-side engine, no required env vars for v1. Internal URL only. Commit the Excel and PPT in the repo as the source files.

When building the app, start from this file. If a later chat disagrees with Excel cached values, Excel wins.
