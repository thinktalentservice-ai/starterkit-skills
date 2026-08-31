---
name: starterkit-theme
description: Use when any colour, gradient, shadow, radius, focus ring or font is chosen in an app using @devopsnext/starterkit-theme — a hex literal about to be written into CSS/SCSS/sx/inline styles; picking between `--primary`, `--primary-text`, `--primary-solid`, `--primary-bg`, `--primary-border`; installing or pinning the package; wiring light/dark mode, a MUI theme, a brand preset or stylesheet import order; migrating or auto-fixing legacy hue names (mint, electric, cobalt, amber, rose, sky, cyan, pink, terminal-green, `--brand-fill`, preset ids like obsidian) to current role names; or diagnosing an outline button failing contrast, a token resolving to nothing, a brand applying in dark but not light, or `useTokenValue` returning "".
license: MIT
compatibility: Core engine is server-safe, zero runtime deps, Node 18+. `./mui` needs @mui/material >= 6; `./react` needs React 18+. Commands shown for pnpm.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-theme

`@devopsnext/starterkit-theme` is the token engine every other `@devopsnext/starterkit-*` package
reads. It publishes **205 CSS custom properties** on `:root` plus a light-scheme override block, and
optionally a MUI theme wired to the same variables.

**Never write a colour literal. Pick a token by JOB.**

> A brand is a colour family plus geometry: give the engine a seed hex and it resolves a whole ramp —
> light scheme, dark scheme, contrast-checked — rather than swapping one flat colour and leaving half
> the UI stale. Almost every mistake below is someone picking a token by what it *looks* closest to
> instead of what it *owes*, and most of them ship green.

## Documented against

| | |
|---|---|
| Package version | **1.4.1** — npm `latest` on 2026-08-31, published 2026-08-31T16:40:19Z |
| `TOKENS_VERSION` | `9451b3ea404a` |
| Root tokens | **205** (`ROOT_TOKEN_NAMES.length`); 100 of them differ in the light block |
| Type-surface fingerprint | `0e940b45aeac` |
| Source | <https://github.com/thinktalentservice-ai/starterkit-theme> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-theme> |

**How much to trust each section:** the suffix table, token inventory, entry-point map, preset values
and MUI mapping are derived from the **published 1.4.1 tarball** — `dist/*.d.ts`, `presets/*.css`,
`schema.json` — and from `src/presets/base.ts` / `src/engine/ladder.ts` in the source repo.
Authoritative. *Choosing*, *Anti-patterns* and *Red flags* are judgement. If the installed version has
moved past 1.4.1, see [Staleness](#staleness--how-to-re-derive) before trusting a table.

`TOKENS_VERSION` is the package's own content hash **over the token NAME set** — it moves when the
contract changes, not on every rebuild. That makes it the right drift signal: if it still reads
`9451b3ea404a`, no token was added, renamed or deleted, whatever the version number says.

## Install — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that literal version
number*. Do not install a range, and do not assume the version this file documents is still latest.

**Step 1 — ask the registry what latest is.** The CLI is preferred because you can paste its answer
straight into step 2:

```bash
npm view @devopsnext/starterkit-theme version
```

Or read it off the package page — the version is at the top right:
<https://www.npmjs.com/package/@devopsnext/starterkit-theme>
(`npm view @devopsnext/starterkit-theme versions --json` lists every published version if you need to
see the history.)

**Step 2 — install that exact number**, substituting whatever step 1 returned:

```bash
pnpm add @devopsnext/starterkit-theme@<version-from-step-1>
```

At the time this file was written step 1 answered `1.4.1`, so step 2 was:

```bash
pnpm add @devopsnext/starterkit-theme@1.4.1
```

`package.json` must end up holding the bare number — `"@devopsnext/starterkit-theme": "1.4.1"`.
**Open it and check.** If your client widened it to `"^1.4.1"`, re-add with `--save-exact`
(npm/pnpm) or `--exact` (yarn).

**Why not just `@latest`.** It installs the same code, but every client writes a **caret** range
instead of the number. A caret lets a later minor bump change every colour on the screen with no
review and no diff, and it fails any `pinned === installed` check. Same for `@^1`, `@~1.4`, `@*` and a
bare `pnpm add <pkg>` — all of them record a range. The point of step 1 is not to avoid new versions;
it is to take the newest one **deliberately**, on a line someone can review.

Upgrading later is the same two steps: re-run step 1, and if the number moved, work through
[Staleness](#staleness--how-to-re-derive) before trusting the tables here.

### Peer dependencies

`@mui/material` (>= 6), `react` and `react-dom` (>= 18) are **optional** peers. Install them only if
you import `./mui` or `./react`. The core entry point has zero runtime dependencies and is safe in
Node, a route handler, or the edge.

### The two stylesheets, and why you need both

```jsx
import "@devopsnext/starterkit-theme/presets/think.css";   // the tokens
import "@devopsnext/starterkit-theme/styles.css";           // structural CSS that READS them
```

**`styles.css` defines no tokens.** It ships `.animate-ib-*`, `.delay-*`, `.glass-card{,-dark}`,
`.mesh-bg{,-subtle}`, `.text-gradient-{role}`, `.glow-{role}`, `.status-chip`, a `--ic-card-focus-ring`
correction for the card package, `box-sizing` on `*`, and a `body` background/colour/font. The
package README calls it "Think's static token sheet" — **the file is right and the README is wrong.**
A preset sheet (`presets/<id>.css`) or an SSR-injected brand block is the token source; `styles.css`
alone gives you 205 `var()`s resolving to nothing.

Both imports belong **once, at the app root** — the root layout, `_app`, or your entry module. Never
from a component. See [references/wiring.md](references/wiring.md) for the full import order and the
Next.js App Router setup.

## Which suffix — the decision table

This is the part that goes wrong. Pick by **job**, not by "which one looks closest". `{f}` is any of
the nine roles: `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green`
`accent-pink`.

| Token | What it IS | Contrast duty | Use it for | Never use it for |
|---|---|---|---|---|
| `--{f}` | the **non-text mark** — ramp slot 2, follows the scheme | **3.0:1** (WCAG 1.4.11), both schemes | any *meaningful* border, an icon, a status dot, a selected/focus edge, a chart stroke | body text; a filled background |
| `--{f}-text` | the family **as text** — ramp slot 1 | **4.5:1** (WCAG 1.4.3), both schemes | the family colour applied to words | fills, borders |
| `--{f}-solid` | **the fill.** Scheme-invariant — one hex in both schemes | none directly (its *label* is measured instead) | button/chip/badge background, gradient stops, anything that must read as "the brand's colour" | text on a surface — it may be illegible there, which is the point of `-text` |
| `--{f}-solid-hover` | `-solid` mixed **8%** toward ink `#0b0f19` | none | hover/active of a `-solid` fill; end stop of `--gradient-{f}` | resting fills |
| `--{f}-on-solid` | **measured ink** — `#0b0f19` or `#ffffff`, scored against the *worse* of `-solid` and `-solid-hover` | it is the answer to a duty | `color:` whenever the background is `--{f}-solid`, `--{f}-solid-hover` or `--gradient-{f}` | text on `--{f}-bg` (a tint over the surface → use `--fg1`) |
| `--{f}-bg` | **the tint** — alpha of the *mark*, 0.14 dark / 0.10 light | none | soft chip/callout/alert background, hover wash of a tinted row | as a fill under `-on-solid` |
| `--{f}-border` | **decorative** subtle border — alpha of the mark, 0.42 dark / 0.36 light. Measures **1.7–3.0:1 and is not meant to clear 3:1** | explicitly none | the edge of a tinted chip or callout, decoration only | **any border that carries meaning** — outline button, focus ring, selected state |
| `--{f}-channel` | `"R G B"` triple **of the mark** | — | `rgb(var(--{f}-channel) / 0.3)` when you need an alpha the ABI does not publish | anywhere `-bg`/`-border` already gives the right alpha |
| `--gradient-{f}` | `linear-gradient(135deg, --{f}-solid, --{f}-solid-hover)` — one family only | its label is `--{f}-on-solid` by construction | gradient fill of that tone | when you want two different families |
| `--glow-{f}` | brand halo `box-shadow`, coloured by the **mark**. Scaled by `intensity` | — | hero/CTA/active-card halo | depth — that is `--shadow-card` |
| `--shadow-btn-{f}` | `0 4px 20px`, coloured by the **seed fill**. Scaled by `intensity` | — | a raised filled button of that tone | non-button surfaces |

**`--{f}-border` is the single most likely token to be picked wrong.** The name reads like "the
border colour for this family" and it explicitly is not one for anything meaningful. An outline button
shipped at 1.56:1 because of exactly this. **Default to `--{f}` for borders.**

**Why the split exists:** the old sheet had one `--mint` doing both the text job and the mark job, so
it was solved for the stricter duty and then spent on fills — which is how a lime brand rendered
olive. Three distinct things now: **text** (4.5:1, moves per scheme), **mark** (3.0:1, moves per
scheme), **fill** (scheme-invariant).

### The one exception to "the fill is never darkened"

`--primary-solid` **is** darkened, and only `primary`, and only far enough to clear **4.5:1 against
white** (`SOLID_WHITE_FLOOR = 4.5`). On think this moves the seed `#37a3fe` to a rendered
`--primary-solid: #007acd`, and `--primary-on-solid` comes out `#ffffff` on **both** presets.

Read that as: **`--{f}-solid` is not guaranteed to equal the seed, and `--{f}-on-solid` is not
guaranteed to be dark ink.** Both are outputs of a measurement. Never hardcode either. The ink
candidate list is unchanged by the floor — white wins because the backdrop moved, not because white
was preferred.

The eight other families are unfloored, deliberately: solving a brand *hue* for the stricter job is
what turned a lime brand olive. The floor is scoped to a blue whose only failing job was carrying
white.

**Ramp mechanic worth knowing:** `ROLE_SLOTS = { text: 1, main: 2 }` with
`ROLE_LIGHT_SHIFT = { text: 3, main: 1 }` — **the two slots cross over between schemes**, because on
a near-black surface text must be *lighter* than the mark and on white it must be *darker*.

## The rest of the token set

Full 205-name inventory, grouped, with both presets' resolved values, is in
[references/tokens.md](references/tokens.md). The shape of it:

| Group | Tokens |
|---|---|
| Surfaces | `--void` `--background` `--surface` `--surface-elevated` `--sidebar-bg` `--card` `--fg1` `--fg2` |
| Neutral veils | `--fg-muted` `--fg-muted-min` `--fg-disabled` `--border` `--glass-border` `--glass-bg` `--glass-bg-card` `--glass-dark-bg` `--hover-overlay` |
| Inputs | `--input` (its **light** value is the keyword `transparent`) `--input-border{,-hover}` `--input-disabled-bg` `--input-disabled-border` |
| Buttons (bare) | `--btn-outline-border{,-hover}` `--btn-ghost-bg{,-hover}` |
| Focus | `--ring` — alpha of the primary **seed** (not the floored fill). Same hue in both schemes; the **alpha** differs, 0.40 dark / 0.30 light |
| Chrome | `--topbar-bg` |
| Depth (neutral) | `--shadow-card` `--shadow-card-hover` `--shadow-elevated` `--shadow-dropdown` — **not** scaled by `intensity`; they are depth cues, not brand |
| Radii | `--radius` (12px default) `--radius-chip` `--radius-card` `--radius-pill` |
| Type / motion | `--font-heading` and `--font-body` — **both `'Plus Jakarta Sans', system-ui, sans-serif`** in the shipped presets; `--font-mono` (`'Geist Mono', ui-monospace, monospace`); `--ease-entrance` |
| Non-family channels | `--background-channel` `--surface-channel` `--card-channel` `--fg1-channel` `--fg2-channel`, plus the two fixed overlays `--white-channel: 255 255 255` and `--black-channel: 0 0 0`. There is **no** `--white` / `--black` base token |

**Outfit is gone.** No shipped preset references it any more — `--font-heading` and `--font-body` both
resolve to Plus Jakarta Sans, and `createStarterkitTheme()`'s typography hardcodes the same string for
`fontFamily`, `h1`–`h6`, `caption`, `button` and `overline`. The only surviving mention is
`buildFontsSheet()`, which still fetches Outfit for consumers who set their own heading face to it.
If an app is loading Outfit via `next/font` and expecting headings to use it, they are not; wire
`--font-heading` yourself.

**Composite gradients — always pair a gradient with its `-ink`:** `--gradient-avatar{,-from,-ink}`,
`--gradient-avatar-2{,-ink}`, `--gradient-avatar-3{,-from,-ink}`, `--gradient-progress`, and the only
two cross-family blends, `--gradient-primary-info{,-ink}` and `--gradient-primary-accent-pink{,-ink}`.
(`--gradient-avatar-2` is byte-identical in value to `--gradient-primary`; two names, two jobs, on
purpose.)

**Status palette** — categorical, fixed hexes, brand-independent, each with a `-channel`, and **absent
from the light block entirely**: `--status-draft` `--status-generating` `--status-review`
`--status-rubric` `--status-deployed` `--status-closed`. Deliberately **not** folded into
`success`/`warning`/`danger`: `--status-review` and `--warning` are the same amber today and mean
different things.

**`--dd-*`** (34 tokens) is the header-dropdown island. It is a **light panel in both schemes by
design** — zero `--dd-*` tokens appear in the light block — and deliberately not brandable: a control
for escaping an unreadable brand must not be painted by it. Do not "fix" it to follow the scheme.

## Colour scheme

**The attribute goes on `<html>`, nowhere else.** `data-mui-color-scheme` is the ABI;
`[data-theme="light"]` is recognised by the component packages as a second selector. Put either on a
`<div>` and roughly half the token set silently keeps its dark value, because the override block
selects the element the custom properties are declared on.

Theme-package specifics:

- A preset sheet is exactly two blocks: `:root { …all 205 tokens… }` then
  `[data-mui-color-scheme="light"] { …only the 100 that differ; color-scheme: light }`. **Only
  differences go in the light block** — a light rule restating a token at equal specificity would beat
  a later `:root` brand override, so a tenant colour would apply in dark and silently not in light.
- `serializeBrandCss` emits `['[data-mui-color-scheme="light"]']` by default. `[data-theme="light"]`
  is **not** emitted unless you ask:
  ```js
  serializeBrandCss(brand, { lightSelectors: ['[data-mui-color-scheme="light"]', '[data-theme="light"]'] })
  ```
- This package emits **no** `prefers-color-scheme` rule at all. Only `@devopsnext/starterkit-layout`
  ships one, as a fallback for hosts with no attribute.

## Entry points

| Import | Contents | Environment |
|---|---|---|
| `@devopsnext/starterkit-theme` | `resolveBrand`, `serializeBrandCss`, colour math, `ROOT_TOKEN_NAMES`, `LIGHT_TOKEN_NAMES`, `TOKENS_VERSION`, `isTokenName` | **server-safe**, zero runtime deps |
| `…/presets` | `PRESET_IDS`, `DEFAULT_PRESET_ID`, `isPresetId`, `PRESETS`, `THINK`, `ELEMETRIK`, `makePreset` | server-safe |
| `…/mui` | `createStarterkitTheme()`, `PALETTE_INTENTIONS`, `REQUIRED_INTENTION_KEYS`, `COLOR_SCHEME_SELECTOR` | server-safe, needs `@mui/material` |
| `…/react` | `BrandProvider`, `useBrand`, `useConcreteTheme`, `useTokenValue`, `ThemeToggle`, `BRAND_STYLE_ELEMENT_ID` | **client-only** (`"use client"`) |
| `…/styles.css` | brand-independent **structural** CSS — defines no tokens | any CSS pipeline |
| `…/presets/*.css` | the brand **token** sheets | any CSS pipeline |
| `…/bootstrap-bridge.css` | repoints `--bs-*` at the tokens; load **after** Bootstrap | any CSS pipeline |
| `…/schema.json` | JSON Schema for a tenant brand document | validation tooling |

`PRESET_IDS = ["think", "elemetrik"]`, `DEFAULT_PRESET_ID = "think"`.

**`PRESETS` is `Partial<Record<PresetId, PresetSpec>>` — `PRESETS[id]` is possibly `undefined`.
Handle it; do not `!` it.**

`resolveBrand` never throws on a legibility problem — it collects them in `warnings`. It **does**
throw on a structural one. `hexToRgb` throws on a malformed hex rather than coercing, deliberately: a
silently-coerced colour ships a wrong brand with no error anywhere.

Wiring — SSR brand injection, the MUI theme, `BrandProvider`, `useTokenValue`'s SSR empty string, and
the Bootstrap bridge — is in [references/wiring.md](references/wiring.md).

## The two presets

Both emitted sheets have a **byte-identical custom-property name list in the same order**. They differ
only in values, and only where two seeds propagate:

| role | think | elemetrik |
|---|---|---|
| `primary` seed | `#37a3fe` → renders `--primary-solid: #007acd` (floored) | `#6832ff` → renders `--primary-solid: #6832ff` |
| `accent` | `#b3d335` (= `accent-green`) | `#ee4480` (= `accent-pink`) |

Everything else — `secondary` `#64748b`, `success` `#4caf50`, `warning` `#f59e0b`, `danger` `#f43f5e`,
`info` `#0058d4`, the fixed categorical roles, ramp shape, neutrals, duties, `radius: 12`,
`intensity: 1`, fonts — is identical. `accent` is the *active brand's* accent and coincides with a
fixed categorical role in both shipped presets; that overlap is intended, do not deduplicate it.

`PresetConfig` may vary only `{ id, name, seeds, intensity = 1, radius = 12, fonts }`, and
`seeds` is `Record<RoleName, string>` — **all nine roles, required**. Anything else is a change to
`src/presets/base.ts` and applies to **both** brands. `acknowledged` is empty in both shipped presets
and is meant to stay empty: if a seed cannot meet a duty, change the seed, or add a reviewed
acknowledgement carrying the measured number. **Never lower a `min`.**

## Legacy names are banned — use the current ones, and fix what you find

**Never write a legacy hue name. If you touch a file that contains one, fix it before you leave.**

The old hue ABI is gone: **74 custom properties** were deleted with **no back-compat aliases and no
warning**. `var(--mint)` resolves to nothing, whatever fallback exists wins, and a wrong colour ships.
This exact failure shipped once in `bootstrap-bridge.css`.

Banned family words, anywhere — token name, `tone=`, `variant=`, `color=`, class name, preset id:

`mint` `electric` `violet` `cobalt` `amber` `amber-brand` `rose` `sky` `cyan` `pink` `terminal-green`

Banned outright: `--brand-fill{,-end,-ink}` `--on-brand-ink` `--on-mint` `--on-sky` `--on-amber`
`--{hue}-fill{,-end,-ink}` `--accent-fill` `--accent-glow` `--avatar-1…6{,-bg}`, and the old suffix
vocabulary `-soft` `-deep` `-brand` `-dim` `-light` `-dark`. Old preset ids `obsidian` `atlas`
`meridian` `solstice` `beacon` `graphite` are history, not API — the catalogue is `think | elemetrik`.

**No exceptions.** Not "it still renders" (it renders a fallback). Not "it is only a comment" (the
next person greps for it). Not "the rest of the file uses the old names" (that is the file to fix, and
a half-migrated file is worse than either state — it reads as deliberate). Not "I will do it in a
follow-up".

### Find them

```bash
grep -rnE '(--|data-tone="|tone="|variant="|color="|\.glow-|\.text-gradient-)(mint|electric|violet|cobalt|amber|rose|sky|cyan|pink|terminal-green|brand-fill|on-brand-ink|avatar-[1-6])\b' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.css' --include='*.scss' --include='*.mjs' src | grep -v -- '--dd-'
```

Repeat `--include` per extension. A quoted brace glob (`'*.{js,css}'`) is **not** expanded by the
shell and **not** understood by grep's matcher, so it silently matches zero files and reads as a clean
repo.

**The `--dd-` exclusion is mandatory, not a convenience.** `--dd-amber` `--dd-blue` `--dd-cobalt`
`--dd-green` `--dd-orange` `--dd-red` `--dd-sky` `--dd-slate` `--dd-violet` are **current, valid**
tokens. The dropdown island keeps hue names on purpose. Rewriting them breaks a working component.

### Fix them — family word is mechanical, the rest is not

| legacy family | current role |
|---|---|
| `mint` | `primary` |
| `electric` / `violet` | `secondary` |
| `cobalt` | `accent` |
| `amber` / `amber-brand` | `warning` |
| `rose` | `danger` |
| **old `accent`** | **`primary`** — see the trap below |
| `sky` `cyan` `pink` `terminal-green` | **culled.** No replacement — re-pick by meaning |

Then three steps that a find-and-replace cannot do:

1. **A bare hue name did two jobs.** Old `--mint` was the text colour *and* the mark. Read the call
   site and pick from the [decision table](#which-suffix--the-decision-table): words →
   `--{f}-text`; border/icon/dot → `--{f}`; filled background → `--{f}-solid`.
2. **Old suffixes have no table.** `-soft` `-deep` `-light` `-dim` were per-family ramp rungs and the
   families disagreed with each other — that inconsistency is why the ABI was replaced. Pick by job.
3. **A component axis value is a meaning, not a colour.** `variant="mint"` on a *deployed* badge
   became `success`, not `primary`, because what it meant was success. Re-derive from what the element
   *is*.

### THE TRAP — four names survived with a different meaning

| name | meant, before | means, today |
|---|---|---|
| `--accent` | the brand hue, an **alias of `--mint`** | the **third** brand hue — a different family |
| `--accent-text` | mint's text rung | the third family's text rung |
| `--accent-border` | mint's decorative border | the third family's decorative border |
| `--gradient-primary` | `--brand-fill → --brand-fill-end` — mint blended into cyan, two *independent* seeds | `--primary-solid → --primary-solid-hover`, one family |

`isTokenName()` returns `true` for all four, in both ABIs. Nothing catches them, no test fails, and the
screen paints the wrong family looking entirely intentional. **In a file being migrated off the legacy
ABI, old `--accent*` becomes `--primary*`.**

Full 74-name map, per-tier fix procedure and worked examples:
[references/migrating.md](references/migrating.md).

### Verify

`isTokenName(name)` is the oracle — it rejects every legacy name and accepts every current one,
`--dd-*` included. Audit what the code actually reads:

```bash
grep -rhoE 'var\(\s*--[a-z0-9-]+' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.css' --include='*.scss' src | sed -E 's/var\(\s*//' | sort -u | node -e "const{isTokenName}=require('@devopsnext/starterkit-theme');let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const n=s.split(/\r?\n/).filter(Boolean);const u=n.filter(x=>!isTokenName(x));console.log('used',n.length,'| not theme tokens',u.length);console.log(u.join('\n'))})"
```

Ignore other namespaces in the output — `--bs-*`, `--ib-*`, `--ic-*`, `--il-*`, `--nf-*`, your own.
Anything else shaped like a theme token is a leftover.

This also matters for brand documents: `schema.json` checks `overrides` keys **structurally only**
(`^--[a-z0-9-]+$`), so a well-formed but unknown name passes the schema and is then silently ignored
by CSS. Run the keys through `isTokenName()` yourself.

### Rationalizations

| Excuse | Reality |
|---|---|
| "It still renders, so it works" | It renders a *fallback*. `var()` on a missing property resolves to nothing — the browser default or an inherited value wins |
| "There must be an alias" | There are deliberately none. A silent `mint → primary` alias is how two vocabularies survive a rename forever |
| "`--mint` maps to `--accent`, they were both 'the brand hue'" | Old `accent` aliased `mint`; today's `--accent` is a different family. This compiles and paints the wrong colour |
| "I'll just swap the hue word everywhere" | Correct for Tier A only. Bare hue names and component axis values need a call-site decision |
| "`--dd-cobalt` is a legacy name too" | It is current and valid. The dropdown is a deliberately non-brandable light panel |
| "`sky` must map to `info`, they're both blue" | `sky` is culled. Picking a role for its colour is the exact habit the role ABI exists to end |
| "It's in a comment, it's harmless" | The next person greps for it and trusts what they find |
| "The build is green" | Nothing in the toolchain can see this. No error, no warning, no failing test |

Also worth knowing: `schema.json`'s `seeds` shape (`primary`/`secondary`/`intensity`/`radius`) is
**narrower** than the engine's `BrandSeeds` (all nine roles), and nothing inside this package maps one
onto the other. Do not assume a brand document can be fed straight to `makePreset`.

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| Any hex literal in a component | Pins one brand; invisible to a token audit | a token |
| `--{f}-border` on an outline button | Measures 1.7–3.0:1; one shipped at 1.56:1 | `--{f}` |
| `--{f}-solid` as text on a surface | It is a fill, solved for its own label, not for your surface | `--{f}-text` |
| `--{f}` as body text | Solved for 3:1, not 4.5:1 | `--{f}-text` |
| `color: #fff` over a brand fill | The measured ink is near-black on a light-seeded brand | `--{f}-on-solid` |
| `color: #0b0f19` over `--primary-solid` | The ink is measured, and on **both** shipped presets it is `#ffffff` | `--{f}-on-solid` |
| Assuming `--{f}-solid` equals the seed | `primary` is floored to clear 4.5:1 against white | read the token |
| A gradient without its `-ink` | The ink is what makes the gradient legible | pair them |
| `--fg1` on `--{f}-solid` | `-bg` is the tint that takes `--fg1`; `-solid` takes `-on-solid` | match the pair |
| Lowering a duty `min` so a seed passes | The duty is the contract | change the seed, or acknowledge with the measured number |
| `--status-review` and `--warning` interchangeably | Same amber today, different meanings | keep them separate |
| Restyling `--dd-*` to follow the scheme | It is a light panel in both schemes by design | leave it |
| `PRESETS[id]!` | It is `Partial<Record<…>>` | handle `undefined` |
| Feeding a brand document straight to `makePreset` | The schema's seeds are narrower than `BrandSeeds` | map it explicitly |
| `styles.css` without a preset sheet | It defines no tokens; every `var()` resolves to nothing | import both |
| `data-mui-color-scheme` on a `<div>` | The override block selects the declaring element | put it on `<html>` |
| `var(--mint)`, `tone="amber"`, `.glow-violet`, `preset: "obsidian"` | Deleted, no alias, no warning — a fallback paints instead | the current role name |
| Rewriting a legacy `--accent` to today's `--accent` | Old `accent` aliased `mint`; today's is a different family | `--primary` |
| Rewriting `--dd-cobalt` / `--dd-sky` / `--dd-amber` | Current, valid, deliberately hue-named | leave them |
| Leaving one legacy name behind "for now" | A half-migrated file reads as deliberate | finish the file |

## Red flags — stop

- About to run `pnpm add …@latest`, `@^1`, `@~1.4` or a bare `pnpm add <pkg>` → all of them record a
  **range**. Look up the latest version, then install that literal number.
- `package.json` shows `"^1.4.1"` rather than `"1.4.1"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry → check first; the
  latest may have moved past 1.4.1.
- About to write a hex literal anywhere in app CSS, `sx` or an inline style → pick a token by job.
- About to use `--{f}-border` for a border that means something → use `--{f}`.
- About to hardcode a label colour over a brand fill → `--{f}-on-solid`.
- About to reach for `mint`, `electric`, `violet`, `cobalt`, `amber`, `rose`, `sky`, `cyan`, `pink` or
  `terminal-green` → **banned.** It resolves to nothing, silently. Use the role name.
- Editing a file that already contains a legacy hue name and planning to leave it → fix the file.
- Migrating a legacy `--accent` to today's `--accent` → it is `--primary`. Different family.
- About to rewrite a `--dd-*` name because it looks like a hue → it is current and valid.
- About to map `sky`/`cyan`/`pink`/`terminal-green` onto a surviving role because the colour is close
  → they are culled. Re-pick by what the thing means.
- About to rename a `tone=` / `variant=` by hue → that value is a meaning. Re-derive it.
- About to import `styles.css` or a preset sheet from a component → both belong once, at the app root.
- About to add `[data-theme="light"]` styling and expecting the theme package to emit it → pass
  `lightSelectors`.
- `useTokenValue()` returned `""` and you are about to treat it as a colour → that is SSR / first
  render. Render a skeleton.
- About to render a second `<style id="brand-vars">` → which one wins becomes document order.

## Staleness — how to re-derive

This file documents 1.4.1. Nothing enforces that; check it. Compare three numbers — what the registry
publishes, what `package.json` pins, and what is actually installed:

```bash
npm view @devopsnext/starterkit-theme version
```

```bash
node -p "require('@devopsnext/starterkit-theme/package.json').version"
```

They should all match, and the `package.json` entry should be a bare number with no `^` or `~`.

**Then check the contract, not just the version** — two of the last three releases moved the version
and nothing else:

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); [t.TOKENS_VERSION, t.ROOT_TOKEN_NAMES.length, t.LIGHT_TOKEN_NAMES.length].join(' ')"
```

Expected: `9451b3ea404a 205 100`. If all three hold, every table above still stands regardless of the
version number — that hash is taken over the token **name** set.

If any of them moved, re-derive **before** trusting a table, in this order:

1. `ROOT_TOKEN_NAMES` — diff it against [references/tokens.md](references/tokens.md).
2. `node_modules/@devopsnext/starterkit-theme/presets/think.css` and `elemetrik.css` — the emitted
   result, and the light block's selector. This is where a changed *value* shows up; the hash will not
   move for one.
3. `dist/index.d.ts`, `dist/presets.d.ts`, `dist/mui.d.ts`, `dist/react/index.d.ts` — the API surface.
4. `node_modules/@devopsnext/starterkit-theme/README.md`, with the `styles.css` caveat above in mind.
5. Upstream source, if checked out — `src/presets/base.ts` for the token rules and duties,
   `src/engine/ladder.ts` for `ROLE_SLOTS` / `SOLID_WHITE_FLOOR` / `HOVER_MIX`, `src/engine/spec.ts`
   for the ramp model. <https://github.com/thinktalentservice-ai/starterkit-theme>
6. What the running app actually resolved, which is the only check that catches a broken import order:
   ```js
   const r = getComputedStyle(document.documentElement);
   [r.getPropertyValue("--tokens-brand"), r.getPropertyValue("--tokens-version")];
   ```
   Those two are emitted **only** when `serializeBrandCss` is called with `provenance`; a preset sheet
   alone does not carry them.
7. If token names changed, re-check `bootstrap-bridge.css` and any app stylesheet for names that no
   longer exist — that is where the silent `var()` failure lands. This bridge was silently broken once
   already, still naming deleted hue families, and Bootstrap fell back to stock literals with no error
   anywhere.
