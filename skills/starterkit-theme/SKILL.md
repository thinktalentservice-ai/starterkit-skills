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
reads. It publishes **210 CSS custom properties** on `:root` (each shipped sheet declares 212 — the two
extra are the `--tokens-version` / `--tokens-brand` provenance pair) plus a light-scheme override
block, and optionally a MUI theme wired to the same variables.

**Never write a colour literal. Pick a token by JOB.**

> A brand is a colour family plus geometry: give the engine a seed hex and it resolves a whole ramp —
> light scheme, dark scheme, contrast-checked — rather than swapping one flat colour and leaving half
> the UI stale. Almost every mistake below is someone picking a token by what it *looks* closest to
> instead of what it *owes*, and most of them ship green.

## Documented against

| | |
|---|---|
| Package version | **1.7.0** — npm `latest` on 2026-11-26, published 2026-11-25T15:53:35Z. The sidebar-rail release: 5 new `--sidebar-*` ink tokens, `--sidebar-bg` dark in both schemes. `styles.css`, `bootstrap-bridge.css` and `schema.json` are byte-identical to 1.6.0 |
| `TOKENS_VERSION` | `ddc9022b81f7` (was `9451b3ea404a` from 1.4.1 through 1.6.0) |
| Root tokens | **210** (`ROOT_TOKEN_NAMES.length`); the light block declares **99** (`LIGHT_TOKEN_NAMES.length`) — not all of them differ from dark any more |
| Light-name fingerprint | `cfb25e7dd09a` — sha256 of `LIGHT_TOKEN_NAMES.join('\n')`, first 12 hex (was `9529c7a66ab1` at 1.5.1–1.6.0, `0f646c594950` at 1.4.1). See [Staleness](#staleness--how-to-re-derive) |
| Type-surface fingerprint | **not re-derived.** The 1.4.1 value `0e940b45aeac` came from a method this skill never recorded, and could not be reproduced from the published `dist/*.d.ts` by any obvious hash, so it is dropped rather than guessed. The type surface did change: `PresetConfig.overrides`, `PresetSpec.overrides`, the `Tuning` type and `SerializeOptions.alwaysLight` are new |
| Source | <https://github.com/thinktalentservice-ai/starterkit-theme> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-theme> |

**How much to trust each section:** the suffix table, token inventory, entry-point map, preset values
and MUI mapping are derived from the **published 1.7.0 tarball** — `dist/*.d.ts`, `dist/mui.js`,
`presets/*.css`, `schema.json` — and from `src/presets/{base,tuning,think,elemetrik}.ts` /
`src/engine/ladder.ts` in the source repo. Authoritative. *Choosing*, *Anti-patterns* and *Red flags*
are judgement. If the installed version has moved past 1.7.0, see
[Staleness](#staleness--how-to-re-derive) before trusting a table.

`TOKENS_VERSION` is the package's own content hash **over the token NAME set** — it moves when the
contract changes, not on every rebuild. If it differs from `ddc9022b81f7`, a token was added, renamed
or deleted. **If it matches, that proves much less than it used to:** 1.4.1 → 1.5.1 left the hash and
both counts untouched while changing almost every colour *value*, nine light-block memberships, the
light radii and the scheme behaviour of several fills. The hash is a names-only signal; values need a
sheet diff.

### What changed in 1.7.0

The sidebar rail is now **dark in both schemes**.

- **Five new tokens**, the rail's own ink, identical in both schemes (so absent from the light block):
  `--sidebar-fg1` `--sidebar-fg2` (both `#ffffff`), `--sidebar-fg-muted`
  (`rgb(255 255 255 / 0.6)`), `--sidebar-border` (`rgb(255 255 255 / 0.12)`),
  `--sidebar-hover-overlay` (`rgb(255 255 255 / 0.08)`).
- **`--sidebar-bg` is `#0d0f1a` in dark and light** (was `#09091a` dark / `#ffffff` light) and left the
  light block. The engine sets it too, so custom brands get the dark rail.
- **Anything painted on `--sidebar-bg` must use the `--sidebar-*` ink.** `--fg1`, `--fg2`, `--border`
  and `--hover-overlay` are dark ink in light, so they are unreadable on the rail.
- **Two new `report` duties:** `--sidebar-fg1` and `--sidebar-fg2` at 4.5:1 on `--sidebar-bg`, both
  schemes. A brand that wants a light rail overrides `--sidebar-bg` **and** the ink together;
  overriding only the background lands in `warnings`.
- **MUI:** the `MuiDrawer` paper now sets `color: var(--sidebar-fg1)`. A child that sets
  `text.secondary` explicitly (`ListItemText` secondary) still needs its own override.
- Pair it with `@devopsnext/starterkit-layout` 1.7.0, which reads these tokens on its rail.

### What changed in 1.6.0

Typography only — no token, value or preset sheet moved.

- **MUI weights soften to 600.** `h1`/`h2` were 800, `h3`/`h4` and `overline` were 700; all are now
  600 (`h5`/`h6` were already 600). The filled/outlined `MuiChip` label is 600 (was 700).
- **MUI body sizes drop a step.** `body1` is `0.8125rem` (13px, was 15px) at line-height 1.6; `body2` is
  `0.75rem` (12px, was 13px). Anything inheriting body1 — `Typography` with no variant, list text,
  dialog content — shrinks by 2px.
- **MUI fields are 12px across the board.** `MuiInputBase` root and `::placeholder` are 12px (were
  14px / 13px); new `MuiInputAdornment` override pins the adornment and its nested `Typography` to
  12px; new `MuiFormHelperText` override sets helper text to 11px / weight 400.
- **`styles.css`** gains `.modal-title { font-size: 15px }` (Bootstrap/reactstrap modal title — a
  class selector, so it beats the `<h5>` it sits on whatever the load order) and `.status-chip` drops
  to weight 600 (was 700).
- The published README now describes `styles.css` correctly (structural CSS, not a token sheet).

### What changed in the 1.4.1 → 1.5.1 window

Read this before trusting an older mental model of the package. Each item is detailed where it
belongs below.

- **1.4.4** — the MUI theme paints contained `Button`, `Fab`, filled `Chip` and `Badge` from the
  `-solid` rung with the `-on-solid` label (it used to use the mark rung behind a `contrastText` label).
- **1.4.5** — think's primary seed is `#008AFF` (was `#37A3FE`); the fill **is** the seed and the label
  is pinned white. The `info` seed became `#37A3FE` in both presets.
- **1.5.0** — a **hand-tuned palette layer** (`PresetSpec.overrides`, `src/presets/tuning.ts`) applied
  through `resolveBrand`, per scheme; think and elemetrik tuned to the palette sign-off. Flat
  gradients, one white light plane, light radii 8/6/12, no coloured glows in light, `-on-solid` white
  for every family. Per the git history, 1.5.0's sheets still used literal-hex flat-gradient stops and
  declared different light blocks (think 102 names, elemetrik 100).
- **1.5.1** — flat gradients use `var()` stops; **every preset sheet declares the same light-block name
  set** (`serializeBrandCss` gained `alwaysLight` for this); default heading and body font is
  **Poppins** (was Plus Jakarta Sans); regenerated token ABI.
- The registry has no 1.4.2 or 1.4.3 — 1.4.1 was followed directly by 1.4.4.

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

At the time this file was written step 1 answered `1.7.0`, so step 2 was:

```bash
pnpm add @devopsnext/starterkit-theme@1.7.0
```

`package.json` must end up holding the bare number — `"@devopsnext/starterkit-theme": "1.7.0"`.
**Open it and check.** If your client widened it to `"^1.7.0"`, re-add with `--save-exact`
(npm/pnpm) or `--exact` (yarn).

**Why not just `@latest`.** It installs the same code, but every client writes a **caret** range
instead of the number. A caret lets a later minor bump change every colour on the screen with no
review and no diff, and it fails any `pinned === installed` check. Same for `@^1`, `@~1.5`, `@*` and a
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
correction for the card package, `box-sizing` on `*`, a `body` background/colour/font, and (1.6.0) a
`.modal-title { font-size: 15px }` for Bootstrap modals. READMEs through 1.5.1 called it "Think's
static token sheet" — that was wrong; the 1.6.0 README calls it brand-independent structural CSS,
which matches the file. (`bootstrap-bridge.css` and `schema.json` are identical from 1.4.1 through
1.7.0; `styles.css` was identical from 1.4.1 to 1.5.1, changed only in typography at 1.6.0, and is
identical again at 1.7.0.)
A preset sheet (`presets/<id>.css`) or an SSR-injected brand block is the token source; `styles.css`
alone gives you 210 `var()`s resolving to nothing.

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
| `--{f}-solid` | **the fill.** The engine makes it scheme-invariant, but the 1.5.x presets hand-tune some per scheme — see the note below the table | none directly (its *label* is measured instead) | button/chip/badge background, gradient stops, anything that must read as "the brand's colour" | text on a surface — it may be illegible there, which is the point of `-text` |
| `--{f}-solid-hover` | `-solid` mixed **8%** toward ink `#0b0f19` (the engine rule; the shipped presets carry hand-set values that sit close to it) | none | hover/active of a `-solid` fill; end stop of `--gradient-{f}` | resting fills |
| `--{f}-on-solid` | the label ink — `#0b0f19` or `#ffffff`. **Measured** (scored against the *worse* of `-solid` and `-solid-hover`) for a custom brand's `secondary`/`accent`; **pinned `#ffffff`** for `primary`, and `#ffffff` for all nine families on the shipped presets | it is the answer to a duty (which the shipped white labels on lime/amber/green do not meet) | `color:` whenever the background is `--{f}-solid`, `--{f}-solid-hover` or `--gradient-{f}` | text on `--{f}-bg` (a tint over the surface → use `--fg1`) |
| `--{f}-bg` | **the tint** — a wash of the *mark* (engine rule: alpha 0.14 dark / 0.10 light; the shipped presets use tuned alphas dark and **opaque hex tints in light**) | none | soft chip/callout/alert background, hover wash of a tinted row | as a fill under `-on-solid` |
| `--{f}-border` | **decorative** subtle border — a tint of the mark (engine rule: alpha 0.42 dark / 0.36 light; shipped presets 0.40 dark, 0.22–0.50 light). Measures **about 1.3–2.7:1 on the 1.5.1 presets** (composited over `--surface`; 1.7–3.0:1 on the engine's untuned derivation) **and is not meant to clear 3:1** | explicitly none | the edge of a tinted chip or callout, decoration only | **any border that carries meaning** — outline button, focus ring, selected state |
| `--{f}-channel` | `"R G B"` triple **of the mark** | — | `rgb(var(--{f}-channel) / 0.3)` when you need an alpha the ABI does not publish | anywhere `-bg`/`-border` already gives the right alpha |
| `--gradient-{f}` | engine rule `linear-gradient(135deg, --{f}-solid, --{f}-solid-hover)`; **on the 1.5.x presets a flat fill**, `linear-gradient(var(--{f}-solid), var(--{f}-solid))` — one family only | its label is `--{f}-on-solid` by construction | gradient fill of that tone | when you want two different families |
| `--glow-{f}` | brand halo `box-shadow`, coloured by the **mark**. Scaled by `intensity`. **`none` in the light scheme** | — | hero/CTA/active-card halo | depth — that is `--shadow-card` |
| `--shadow-btn-{f}` | `0 4px 20px`, coloured by the **seed fill**. Scaled by `intensity`. **`none` in the light scheme** | — | a raised filled button of that tone | non-button surfaces |

**`--{f}-border` is the single most likely token to be picked wrong.** The name reads like "the
border colour for this family" and it explicitly is not one for anything meaningful. An outline button
shipped at 1.56:1 because of exactly this. **Default to `--{f}` for borders.**

**Why the split exists:** the old sheet had one `--mint` doing both the text job and the mark job, so
it was solved for the stricter duty and then spent on fills — which is how a lime brand rendered
olive. Three distinct things now: **text** (4.5:1, moves per scheme), **mark** (3.0:1, moves per
scheme), **fill** (one hex by the engine's rule; see the hand-tuned note below).

### The one exception to "the fill is never darkened"

The engine can darken `--primary-solid` — only `primary`, and only when the seed carries white worse
than `SOLID_WHITE_FLOOR`. **That floor is `2.5` at 1.5.1** (it was 4.5 at 1.4.1, which sank think's
old `#37a3fe` seed to `#007acd`). Think's seed is now `#008AFF`, white on it is 3.45:1, so the floor
sits below it and `sink` returns the seed untouched — the fill **is** the seed. The mechanism remains
for tenant seeds paler than about 2.5:1, where a white label would be unreadable on any terms.

`--primary-on-solid` is **pinned to white** for every brand (`candidates: [FILL_WHITE]`), not measured —
the ink crossover is 4.376:1, so measuring a 3.45:1 blue would hand it the dark label. That is a
recorded owner decision (2026-11-05) and a known cost: on think, white reads **3.45:1** on the light
fill `#008aff` and **2.74:1** on the dark fill `#3aa0ff` (my measurement of the shipped hexes) —
below 4.5:1 text contrast. Elemetrik's violet carries white at 5.93:1.

Read that as: **`--{f}-solid` is not guaranteed to equal the seed, and `--{f}-on-solid` is not
guaranteed to be dark ink — on the shipped presets it is white for all nine families.** Never
hardcode either; read the token.

The eight other families are unfloored, deliberately: solving a brand *hue* for the stricter job is
what turned a lime brand olive. The floor is scoped to `primary`.

### The hand-tuned palette

From 1.5.0 the shipped presets carry a **reviewed tuning layer** on top of what the engine derives —
`PresetSpec.overrides` (shared values in `src/presets/tuning.ts`, per-brand in `think.ts` /
`elemetrik.ts`), applied by `resolveBrand` per scheme. It runs in three places so downstream tokens
(`-bg`, `-border`, glows, channels) derive from the tuned mark, and **every duty is still measured
against the final values**: a miss lands in `warnings`, it is not suppressed. The source's own header
comments describe the *engine* derivation (a floored `#007acd` fill, olive light-mode lime); **where
they contradict the sheets, the tuning is what ships.**

What it changed, as it shows up in the shipped sheets:

- **Fills.** Think's primary is one blue everywhere: `#3aa0ff` dark, `#008aff` light — and `info` is
  that same blue in **both** presets. `--primary-solid`, `--info-solid` and `--secondary-solid` therefore
  **differ between schemes** (elemetrik's primary fill `#6835ff` does not; its secondary fill does).
  Every fill has a white `-on-solid`. Every `--gradient-{f}` is a flat fill.
- **Secondary** is navy on think (`#0e2a4d`, lifted to `#2b4366` as a dark fill so it does not vanish
  on near-black) and aubergine on elemetrik (`#1f1442`, lifted to `#3a2c6e`) — no longer slate `#64748b`.
- **Accent** is the logo lime `#b3d335` flat on think (solid and mark the same in both schemes) and a
  pink fill `#d42a68` on elemetrik.
- **Light scheme** is one white content plane (`--background` `--surface` `--card` all `#ffffff`; the
  sidebar rail stays dark from 1.7.0), tighter radii
  (`--radius` 8px, `--radius-chip` 6px, `--radius-card` 12px), hairline shadows, and **no coloured
  glows or button shadows (`none`)**.
- **Known, shipped duty misses** — `resolveBrand` returns 4 warnings on think and 3 on elemetrik, all
  light-scheme **mark** (3:1) duties: `--success`, `--warning`, `--accent-green`, plus `--accent` on
  think. White labels on the lime, amber and green fills are below 4.5:1 by design (1.71 / 2.15 /
  2.78). `acknowledged` is empty in both presets.

**Custom brands inherit the shared layer too** — `makePreset` merges it under your `overrides`. A custom
`info` seed is ignored (still `#3aa0ff` / `#008aff`), as are the fills of `accent-green`, `accent-pink`,
`success`, `warning` and `danger` and the whole light neutral/shape set. Details and the escape hatch
are in [references/wiring.md](references/wiring.md#custom-brands). The engine's own invariant tests run
on the *untuned* presets, so "the engine guarantees X" and "the sheet ships X" are different statements
at 1.5.x — verify against the sheet.

**Ramp mechanic worth knowing:** `ROLE_SLOTS = { text: 1, main: 2 }` with
`ROLE_LIGHT_SHIFT = { text: 3, main: 1 }` — **the two slots cross over between schemes**, because on
a near-black surface text must be *lighter* than the mark and on white it must be *darker*.

## The rest of the token set

Full 210-name inventory, grouped, with both presets' resolved values, is in
[references/tokens.md](references/tokens.md). The shape of it:

| Group | Tokens |
|---|---|
| Surfaces | `--void` `--background` `--surface` `--surface-elevated` `--sidebar-bg` `--card` `--fg1` `--fg2` |
| Neutral veils | `--fg-muted` `--fg-muted-min` `--fg-disabled` `--border` `--glass-border` `--glass-bg` `--glass-bg-card` `--glass-dark-bg` `--hover-overlay` |
| Inputs | `--input` (its **light** value is the keyword `transparent`) `--input-border{,-hover}` `--input-disabled-bg` `--input-disabled-border` |
| Buttons (bare) | `--btn-outline-border{,-hover}` `--btn-ghost-bg{,-hover}` |
| Focus | `--ring` — the primary **mark** of each scheme at alpha 0.4 (think `rgb(58 160 255 / 0.4)` dark, `rgb(0 138 255 / 0.4)` light; elemetrik `#8a63ff` / `#6835ff` hues). Through 1.4.1 it was the seed at 0.40 dark / 0.30 light |
| Chrome | `--topbar-bg` |
| Sidebar rail ink (1.7.0) | `--sidebar-fg1` `--sidebar-fg2` `--sidebar-fg-muted` `--sidebar-border` `--sidebar-hover-overlay` — the ink for a surface painted `--sidebar-bg`; same value in both schemes |
| Depth (neutral) | `--shadow-card` `--shadow-card-hover` `--shadow-elevated` `--shadow-dropdown` — **not** scaled by `intensity`; they are depth cues, not brand. Hairline + faint drop in light (1.5.0) |
| Radii | `--radius` `--radius-chip` `--radius-card` `--radius-pill` — **scheme-dependent**: 12 / 16 / 20px in dark, **8 / 6 / 12px in light** (pill is `9999px` in both). `PresetConfig.radius` moves the dark values only |
| Type / motion | `--font-heading` and `--font-body` — **both `'Poppins', system-ui, sans-serif`** in the shipped presets (1.5.1; Plus Jakarta Sans through 1.5.0); `--font-mono` (`'Geist Mono', ui-monospace, monospace`); `--ease-entrance` |
| Non-family channels | `--background-channel` `--surface-channel` `--card-channel` `--fg1-channel` `--fg2-channel`, plus the two fixed overlays `--white-channel: 255 255 255` and `--black-channel: 0 0 0`. There is **no** `--white` / `--black` base token |

**The default face is Poppins (1.5.1).** `--font-heading` and `--font-body` both resolve to Poppins, and
`createStarterkitTheme()`'s typography hardcodes the same string for `fontFamily`, `h1`–`h6`, `caption`,
`button` and `overline`. **Nothing in the package loads the font file** — the sheets only name the face,
so load Poppins yourself (or the opt-in CDN `fonts.css`). Outfit and Plus Jakarta Sans are referenced by
no shipped preset; they survive only in `buildFontsSheet()`'s whitelist. If an app is still loading
Plus Jakarta Sans or Outfit via `next/font` and expecting headings to use it, they are not; wire
`--font-heading` yourself.

**Composite gradients — always pair a gradient with its `-ink`:** `--gradient-avatar{,-from,-ink}`,
`--gradient-avatar-2{,-ink}`, `--gradient-avatar-3{,-from,-ink}`, `--gradient-progress`, and the only
two cross-family blends, `--gradient-primary-info{,-ink}` and `--gradient-primary-accent-pink{,-ink}`.
(In 1.5.1 `--gradient-avatar` is byte-identical in value to `--gradient-primary` — both flat primary;
`--gradient-avatar-2` is the 135° `--primary-solid` → `--primary-solid-hover` sweep. Two names, two jobs, on
purpose. On think `--gradient-primary-info` renders one colour, because primary and info are the same
blue.)

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

- A preset sheet is exactly two blocks: `:root { …all 210 tokens, plus --tokens-version and
  --tokens-brand… }` then `[data-mui-color-scheme="light"] { …the 99 names in LIGHT_TOKEN_NAMES;
  color-scheme: light }`. **By default only differences go in the light block** — a light rule
  restating a token at equal specificity would beat a later `:root` brand override, so a tenant colour
  would apply in dark and silently not in light. **The shipped sheets are the deliberate exception (1.5.1):**
  both declare the same 99 names (`serializeBrandCss`'s `alwaysLight`), so a few entries equal their dark
  value (think's `--accent` and `--accent-channel`; elemetrik's `--primary-solid` and
  `--primary-solid-hover`). The set of names is fixed; the values per scheme are not all different.
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

Both emitted sheets have a **byte-identical custom-property name list in the same order** (212
declarations each). They differ in 32 `:root` values (plus `--tokens-brand`) and 20 light-block values:
the `primary`, `secondary` and `accent` families, `--ring`, `--shadow-card-hover`, those families' glows
and button shadows, and the avatar stops/inks. The seeds below are what the engine is given; the
*shipped* values are the hand-tuned ones (see [the hand-tuned palette](#the-hand-tuned-palette)):

| role | think | elemetrik |
|---|---|---|
| `primary` seed | `#008AFF` | `#6832FF` |
| `primary` shipped fill / mark | fill `#3aa0ff` dark, `#008aff` light; mark the same | fill `#6835ff` both schemes; mark `#8a63ff` dark, `#6835ff` light |
| `secondary` shipped (seed `#64748B` in both) | navy — mark `#7b8fa8` / `#0e2a4d`, fill `#2b4366` / `#0e2a4d` | aubergine — mark `#8a7fb0` / `#1f1442`, fill `#3a2c6e` / `#1f1442` |
| `accent` seed | `#B3D335` (= `accent-green`) | `#EE4480` (= `accent-pink`) |
| `accent` shipped fill | `#b3d335` | `#d42a68` (= `accent-pink-solid`) |

(Mark values are dark / light.) Everything else — `success` `#4caf50`, `warning` `#f59e0b`, `danger`
`#f43f5e`, `info` (seed `#37A3FE`, **shipped `#3aa0ff` dark / `#008aff` light** — think's blue, in both
presets), the fixed categorical roles, ramp shape, neutrals, duties, `intensity: 1`, `radius: 12` (dark),
fonts — is identical. `accent` is the *active brand's* accent and coincides with a fixed categorical
role in both shipped presets; that overlap is intended, do not deduplicate it.

`PresetConfig` may vary only `{ id, name, seeds, intensity = 1, radius = 12, fonts, overrides }`, and
`seeds` is `Record<RoleName, string>` — **all nine roles, required**. Anything else is a change to
`src/presets/base.ts` or the shared `src/presets/tuning.ts` and applies to **both** brands (and to every
`makePreset` brand). `acknowledged` is empty in both shipped presets and is meant to stay empty: if a
seed cannot meet a duty, change the seed, or add a reviewed acknowledgement carrying the measured
number. **Never lower a `min`.**

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
| `--gradient-primary` | `--brand-fill → --brand-fill-end` — mint blended into cyan, two *independent* seeds | one family — engine rule `--primary-solid → --primary-solid-hover`; a flat `--primary-solid` on the 1.5.x presets |

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
| `--{f}-border` on an outline button | Measures about 1.3–2.7:1 on the 1.5.1 presets; one shipped at 1.56:1 | `--{f}` |
| `--{f}-solid` as text on a surface | It is a fill, solved for its own label, not for your surface | `--{f}-text` |
| `--{f}` as body text | Solved for 3:1, not 4.5:1 | `--{f}-text` |
| `color: #fff` over a brand fill | The shipped presets happen to use white everywhere, but a custom brand's `accent`/`secondary` can measure to near-black ink — and the white is a tuning decision that can change | `--{f}-on-solid` |
| `color: #0b0f19` over `--primary-solid` | `primary`'s label is pinned white on every brand | `--{f}-on-solid` |
| Assuming `--{f}-solid` equals the seed, or equals itself across schemes | Fills are hand-tuned on the shipped presets (think `info` and `primary` flip `#3aa0ff` → `#008aff`; every `secondary` flips) and `primary` can still be floored for a pale tenant seed | read the token |
| Parsing `--glow-*` / `--shadow-btn-*` as a colour, or relying on them in light | They are the keyword `none` in the light scheme | treat as a `box-shadow` value that may be `none` |
| Expecting `makePreset({ radius })`, an `info` seed or light surfaces to take effect in a custom brand | The shared tuning layer pins light radii (8/6/12), `info`, and several fills; only the dark radii follow `radius` | pass `overrides`, see [wiring](references/wiring.md#custom-brands) |
| Treating a matching `TOKENS_VERSION` as "nothing changed" | It hashes names only; 1.4.1 → 1.5.1 kept it while values and light-block membership moved | diff the sheets and the light-name fingerprint |
| A gradient without its `-ink` | The ink is what makes the gradient legible | pair them |
| `--fg1` / `--fg2` / `--border` on a `--sidebar-bg` surface | Dark ink in light, on a rail that is dark in both schemes (1.7.0) | `--sidebar-fg1` / `--sidebar-fg2` / `--sidebar-border` |
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

- About to run `pnpm add …@latest`, `@^1`, `@~1.7` or a bare `pnpm add <pkg>` → all of them record a
  **range**. Look up the latest version, then install that literal number.
- `package.json` shows `"^1.7.0"` rather than `"1.7.0"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry → check first; the
  latest may have moved past 1.7.0.
- Bumping from ≤1.5.1 and an MUI screen suddenly reads smaller and lighter → that is 1.6.0's
  typography (body1 13px, fields 12px, headings 600), not a broken font load. Do not "fix" it with
  `sx` sizes; if a product needs the old scale, override `typography` once in `createTheme(base, …)`.
- Bumping from ≤1.6.0 and light-mode sidebar text vanishes → it is painted `--fg1`/`--fg2` on the now
  dark `--sidebar-bg`. Use `--sidebar-fg1`/`--sidebar-fg2`, and delete host overrides that darkened
  the rail by hand.
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

This file documents 1.7.0. Nothing enforces that; check it. Compare three numbers — what the registry
publishes, what `package.json` pins, and what is actually installed:

```bash
npm view @devopsnext/starterkit-theme version
```

```bash
node -p "require('@devopsnext/starterkit-theme/package.json').version"
```

They should all match, and the `package.json` entry should be a bare number with no `^` or `~`.

**Then check the contract, not just the version** — releases have moved the version and nothing in
the name set, and 1.4.1 → 1.5.1 moved almost every *value* while the name set stayed put:

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); [t.TOKENS_VERSION, t.ROOT_TOKEN_NAMES.length, t.LIGHT_TOKEN_NAMES.length].join(' ')"
```

Expected: `ddc9022b81f7 210 99` (verified against the published 1.7.0 tarball).
If any of them differs, the **name set** moved. If all three hold, **the names still stand — the values
may not.** That hash is taken over the token **name** set only, and the 1.4.1 → 1.5.1 window proved it:
same three numbers, different light-block membership (9 names in, 9 out) and a re-tuned palette. So also
fingerprint the light-block names (expected `cfb25e7dd09a` at 1.7.0):

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); require('crypto').createHash('sha256').update(t.LIGHT_TOKEN_NAMES.join('\n')).digest('hex').slice(0,12)"
```

and, because no hash covers values, **diff `presets/think.css` and `presets/elemetrik.css` against the
tables in [references/tokens.md](references/tokens.md)** whenever the version number moved.

If any of them moved, re-derive **before** trusting a table, in this order:

1. `ROOT_TOKEN_NAMES` — diff it against [references/tokens.md](references/tokens.md).
2. `node_modules/@devopsnext/starterkit-theme/presets/think.css` and `elemetrik.css` — the emitted
   result, and the light block's selector. This is where a changed *value* shows up; the hash will not
   move for one.
3. `dist/index.d.ts`, `dist/presets.d.ts`, `dist/mui.d.ts`, `dist/react/index.d.ts`, `dist/spec-*.d.ts` —
   the API surface (`PresetSpec` lives in the spec file). There is no recorded type-surface fingerprint;
   diff these by eye or with `diff` against the previous install.
4. `node_modules/@devopsnext/starterkit-theme/README.md`, with the `styles.css` caveat above in mind.
5. Upstream source, if checked out — `src/presets/base.ts` for the token rules and duties,
   `src/presets/tuning.ts` (shared hand-tuned values) and `think.ts` / `elemetrik.ts` (per-brand
   tuning) for what actually ships, `src/engine/ladder.ts` for `ROLE_SLOTS` / `SOLID_WHITE_FLOOR` /
   `HOVER_MIX`, `src/engine/spec.ts` for the ramp model. Their header comments describe the *engine*
   derivation and are partly stale where the tuning overrides it. <https://github.com/thinktalentservice-ai/starterkit-theme>
6. What the running app actually resolved, which is the only check that catches a broken import order:
   ```js
   const r = getComputedStyle(document.documentElement);
   [r.getPropertyValue("--tokens-brand"), r.getPropertyValue("--tokens-version")];
   ```
   `serializeBrandCss` emits those two **only** when called with `provenance`; the shipped `presets/*.css`
   sheets already carry both as literals (`--tokens-version: "ddc9022b81f7"`, `--tokens-brand: "think"`
   or `"elemetrik"`), so a preset-sheet app reads them without any extra step.
7. If token names changed, re-check `bootstrap-bridge.css` and any app stylesheet for names that no
   longer exist — that is where the silent `var()` failure lands. This bridge was silently broken once
   already, still naming deleted hue families, and Bootstrap fell back to stock literals with no error
   anywhere.
