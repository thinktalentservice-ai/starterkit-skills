# Token inventory — `@devopsnext/starterkit-theme` 1.5.1

Companion to [SKILL.md](../SKILL.md). This is the full `ROOT_TOKEN_NAMES` set with resolved values,
for diffing when the drift check fires. Read the decision table in SKILL.md before picking from here —
this file tells you what exists, not what it owes.

**Verified against the published 1.5.1 tarball**, `presets/think.css` and `presets/elemetrik.css`.

```
TOKENS_VERSION      9451b3ea404a   (unchanged since 1.4.1 — see the note below)
ROOT_TOKEN_NAMES    205
LIGHT_TOKEN_NAMES   100   (the names the light block declares — the same set in both sheets)
CHANNEL_TOKEN_NAMES  22
PROVENANCE          --tokens-version, --tokens-brand  (emitted by serializeBrandCss({ provenance }) AND already declared in both shipped preset sheets)
```

**The name set did not change between 1.4.1 and 1.5.1** — no token was added, renamed or deleted, so
the hash and both counts are identical. **Three things did change underneath them:** nearly every
*value*; the *membership* of the light block (9 names in, 9 out, so the count stayed 100); and the
scheme behaviour of a few fills. All three are covered below. Each shipped sheet declares **207**
custom properties on `:root` — the 205 names plus the two provenance ones.

Light block membership, 1.4.1 → 1.5.1 (hand-tuned presets now flip different subsets per brand, so
both sheets declare the union):

- **In:** `--primary-solid` `--primary-solid-hover` `--secondary-solid` `--secondary-solid-hover`
  `--info-solid` `--info-solid-hover` `--radius` `--radius-chip` `--radius-card`
- **Out:** `--success` `--success-channel` `--warning` `--warning-border` `--warning-channel`
  `--danger` `--danger-channel` `--accent-green` `--accent-green-channel` — these are now identical
  in both schemes, so the light block no longer restates them
- `LIGHT_FLIPPED_TOKEN_NAMES` is the same 100-name set as `LIGHT_TOKEN_NAMES` in 1.5.1.

Regenerate the counts with:

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); [t.TOKENS_VERSION, t.ROOT_TOKEN_NAMES.length, t.LIGHT_TOKEN_NAMES.length].join(' ')"
```

Those three held across 1.4.1 → 1.5.1 while the light block's membership and almost every value
moved, so they are not enough on their own. Fingerprint the light-block name list too — `9529c7a66ab1`
at 1.5.1 (`0f646c594950` at 1.4.1):

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); require('crypto').createHash('sha256').update(t.LIGHT_TOKEN_NAMES.join('\n')).digest('hex').slice(0,12)"
```

Values are not covered by any hash. To see what moved, diff `presets/think.css` and
`presets/elemetrik.css` against the tables below.

## Family tokens — 8 per role × 9 roles = 72

For every `{f}` in `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green`
`accent-pink`:

`--{f}` `--{f}-text` `--{f}-solid` `--{f}-solid-hover` `--{f}-on-solid` `--{f}-bg` `--{f}-border`
`--{f}-channel`

Plus, per role, `--gradient-{f}`, `--glow-{f}` and `--shadow-btn-{f}` (counted under their own groups
below).

`-bg` and `-border` are tints of the **mark**. The engine's own rule is alpha 0.14 dark / 0.10 light
(`-bg`) and 0.42 dark / 0.36 light (`-border`), but **the shipped presets override both with
hand-tuned values** — a dark `-bg` is an alpha of 0.14–0.18, a dark `-border` 0.40, a light `-border`
0.22–0.50, and every light `-bg` is an **opaque hex** (think primary `#e8f4ff`, not an alpha). They are
therefore not derivable from the engine rule; for the exact figures read `presets/<id>.css`, or use
`rgb(var(--{f}-channel) / α)` when you need a specific alpha.

### Resolved values

From 1.5.1 the shipped values are **hand-tuned** (see [SKILL.md](../SKILL.md#the-hand-tuned-palette)).
`=` means the preset's light value equals its own dark value. In the elemetrik columns, `same` means
identical to the think cell in that column.

| token | think dark | think light | elemetrik dark | elemetrik light |
|---|---|---|---|---|
| `--primary` | `#3aa0ff` | `#008aff` | `#8a63ff` | `#6835ff` |
| `--primary-text` | `#7cc0ff` | `#0067c7` | `#a58aff` | `#4b1fcc` |
| `--primary-solid` | `#3aa0ff` | `#008aff` | `#6835ff` | = |
| `--primary-solid-hover` | `#2b93f5` | `#0080ee` | `#5a27ee` | = |
| `--primary-on-solid` | `#ffffff` | = | same | same |
| `--secondary` | `#7b8fa8` | `#0e2a4d` | `#8a7fb0` | `#1f1442` |
| `--secondary-text` | `#a3b1c4` | `#0e2a4d` | `#b0a8cc` | `#1f1442` |
| `--secondary-solid` | `#2b4366` | `#0e2a4d` | `#3a2c6e` | `#1f1442` |
| `--secondary-solid-hover` | `#33507a` | `#163a66` | `#45357f` | `#2c1d5c` |
| `--secondary-on-solid` | `#ffffff` | = | same | same |
| `--accent` | `#b3d335` | = | `#ee4f86` | `#e93574` |
| `--accent-text` | `#c8e063` | `#4a6600` | `#f27aa3` | `#b4205a` |
| `--accent-solid` | `#b3d335` | = | `#d42a68` | = |
| `--accent-solid-hover` | `#a6c333` | = | `#bb2059` | = |
| `--accent-on-solid` | `#ffffff` | = | same | same |
| `--success` | `#4caf50` | = | same | same |
| `--success-text` | `#6eba67` | `#2e7d32` | same | same |
| `--success-solid` | `#4caf50` | = | same | same |
| `--success-solid-hover` | `#47a24c` | = | same | same |
| `--success-on-solid` | `#ffffff` | = | same | same |
| `--warning` | `#f59e0b` | = | same | same |
| `--warning-text` | `#feb054` | `#b54708` | same | same |
| `--warning-solid` | `#f59e0b` | = | same | same |
| `--warning-solid-hover` | `#e2930c` | = | same | same |
| `--warning-on-solid` | `#ffffff` | = | same | same |
| `--danger` | `#f43f5e` | = | same | same |
| `--danger-text` | `#f86278` | `#be123c` | same | same |
| `--danger-solid` | `#f43f5e` | = | same | same |
| `--danger-solid-hover` | `#e13b58` | = | same | same |
| `--danger-on-solid` | `#ffffff` | = | same | same |
| `--info` | `#3aa0ff` | `#008aff` | same | same |
| `--info-text` | `#7cc0ff` | `#0067c7` | same | same |
| `--info-solid` | `#3aa0ff` | `#008aff` | same | same |
| `--info-solid-hover` | `#2b93f5` | `#0080ee` | same | same |
| `--info-on-solid` | `#ffffff` | = | same | same |
| `--accent-green` | `#b3d335` | = | same | same |
| `--accent-green-text` | `#c8e063` | `#4a6600` | same | same |
| `--accent-green-solid` | `#b3d335` | = | same | same |
| `--accent-green-solid-hover` | `#a6c333` | = | same | same |
| `--accent-green-on-solid` | `#ffffff` | = | same | same |
| `--accent-pink` | `#ee4f86` | `#e93574` | same | same |
| `--accent-pink-text` | `#f27aa3` | `#b4205a` | same | same |
| `--accent-pink-solid` | `#d42a68` | = | same | same |
| `--accent-pink-solid-hover` | `#bb2059` | = | same | same |
| `--accent-pink-on-solid` | `#ffffff` | = | same | same |

Three things to read out of that table:

1. **A solid fill is no longer guaranteed scheme-invariant.** On think, `--primary-solid` is `#3aa0ff`
   dark / `#008aff` light, `--info-solid` likewise, and `--secondary-solid` is lifted in dark (`#2b4366`
   vs `#0e2a4d`) so a navy fill does not vanish on near-black. Elemetrik's `--primary-solid` and
   `--accent-solid` are one hex in both schemes but its `--secondary-solid` flips. If a call site
   assumes "same fill in both schemes", it is only true for `accent` `success` `warning` `danger`
   `accent-green` `accent-pink` today. Read the token, never copy the hex.
2. **`--{f}-on-solid` is `#ffffff` for all nine families, in both presets and both schemes** — a
   hand-tuned decision ("every solid fill takes a white label"), not a measurement. White on lime
   `#b3d335` is 1.71:1, on amber `#f59e0b` 2.15:1, on green `#4caf50` 2.78:1; on think's dark
   `--primary-solid` it is 2.74:1. Those are below WCAG 1.4.3 / 1.4.11 and the package ships them
   knowingly. Always take the label from `--{f}-on-solid` rather than assuming white or dark, because
   a **custom** `makePreset` brand still measures it (see SKILL.md).
3. **`accent` duplicates a fixed categorical role in both presets** — `accent-green` on think,
   `accent-pink` on elemetrik (the *marks* match; elemetrik's `--accent-solid` `#d42a68` is
   `--accent-pink-solid`, and think's `--accent-solid` `#b3d335` is `--accent-green-solid`). Intended.
   Do not deduplicate.
4. **`--info` is the same blue as think's primary, in both presets** — `#3aa0ff` dark / `#008aff`
   light. Elemetrik's primary is violet; its `--info` is still Think Talent blue.

## Surfaces and neutrals — 27

Identical across both presets. The light column is hand-tuned (1.5.0): one white plane — `--background`,
`--surface`, `--sidebar-bg`, `--card` and `--topbar-bg` are all `#ffffff` — with depth from hairlines
rather than grey fills, and the neutral ramp is opaque hex where it used to be alpha-black.

| token | dark | light |
|---|---|---|
| `--void` | `#07080f` | `#e8eaf2` |
| `--background` | `#0d0f1a` | `#ffffff` |
| `--surface` | `#10121c` | `#ffffff` |
| `--surface-elevated` | `#161925` | `#f7f8fa` |
| `--sidebar-bg` | `#09091a` | `#ffffff` |
| `--card` | `#12141f` | `#ffffff` |
| `--fg1` | `#f0f2ff` | `#0e1525` |
| `--fg2` | `#8b93b5` | `#465267` |
| `--fg-muted` | `rgba(255, 255, 255, 0.45)` | `#5f6b7e` |
| `--fg-muted-min` | `rgba(255, 255, 255, 0.38)` | `#6b7689` |
| `--fg-disabled` | `rgba(255, 255, 255, 0.28)` | `#a3abb8` |
| `--border` | `rgba(255, 255, 255, 0.08)` | `#e7e9ee` |
| `--glass-border` | `rgba(255, 255, 255, 0.09)` | `#e7e9ee` |
| `--glass-bg` | `rgba(255, 255, 255, 0.035)` | `#ffffff` |
| `--glass-bg-card` | `rgba(255, 255, 255, 0.03)` | `#ffffff` |
| `--glass-dark-bg` | `rgba(0, 0, 0, 0.25)` | `rgba(0, 0, 0, 0.06)` |
| `--hover-overlay` | `rgba(255, 255, 255, 0.06)` | `rgb(14 21 37 / 0.04)` |
| `--topbar-bg` | `rgba(7, 8, 15, 0.85)` | `#ffffff` |
| `--input` | `rgba(255, 255, 255, 0.10)` | **`transparent`** — a keyword, not a colour |
| `--input-border` | `rgba(255, 255, 255, 0.08)` | `#d5dae1` |
| `--input-border-hover` | `rgba(255, 255, 255, 0.16)` | `#b6bfcc` |
| `--input-disabled-bg` | `rgba(255, 255, 255, 0.03)` | `rgba(0, 0, 0, 0.04)` |
| `--input-disabled-border` | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.10)` |
| `--btn-outline-border` | `rgba(255, 255, 255, 0.34)` | `#d5dae1` |
| `--btn-outline-border-hover` | `rgba(255, 255, 255, 0.55)` | `#b6bfcc` |
| `--btn-ghost-bg` | `rgba(255, 255, 255, 0.05)` | `rgb(14 21 37 / 0.04)` |
| `--btn-ghost-bg-hover` | `rgba(255, 255, 255, 0.10)` | `rgb(14 21 37 / 0.07)` |

`--input`'s light value being the keyword `transparent` catches anyone who tries to `color-mix()` or
parse it. Handle it.

## Focus — 1

| token | think dark | think light | elemetrik dark | elemetrik light |
|---|---|---|---|---|
| `--ring` | `rgb(58 160 255 / 0.4)` | `rgb(0 138 255 / 0.4)` | `rgb(138 99 255 / 0.4)` | `rgb(104 53 255 / 0.4)` |

At 1.5.1 the ring is tuned to the primary **mark** of each scheme — the same colour as that scheme's
`--primary` — at alpha 0.4 in both schemes. (Through 1.4.1 it was the seed at 0.40 dark / 0.30 light,
the same hue in both schemes.) Because the colour now differs per scheme it is in the light block.

## Depth — 4 neutral + 9 glow + 9 button = 22

**Neutral, not scaled by `intensity`** (they are depth cues, not brand): `--shadow-card`
`--shadow-card-hover` `--shadow-elevated` `--shadow-dropdown`.

**Brand, scaled by `intensity`:**

- `--glow-{f}` — two layers, `0 0 20px` @ 0.35 and `0 0 60px` @ 0.12 in dark, coloured by the
  **mark**.
- `--shadow-btn-{f}` — one layer, `0 4px 20px` @ 0.40 in dark, coloured by the **seed fill**.

Nine of each, one per role. `intensity: 0` flattens every coloured one at once and leaves the four
neutral drop-shadows intact.

**In the light scheme all 18 are the keyword `none`** (hand-tuned, 1.5.0: "no coloured glows in light
mode"), and the four neutral shadows become hairline + faint drop: `--shadow-card`
`0 1px 2px rgb(16 24 40 / 0.04)`, `--shadow-card-hover` `0 2px 6px rgb(16 24 40 / 0.06)`,
`--shadow-elevated` `0 0 0 1px #e7e9ee, 0 12px 32px -12px rgb(16 24 40 / 0.18)`, `--shadow-dropdown`
`0 0 0 1px #e7e9ee, 0 12px 32px -12px rgb(16 24 40 / 0.2)`. Do not parse a glow or button shadow as a
colour; it may be `none`. Dark `--shadow-card-hover` is brand-tinted (think `#3aa0ff` / elemetrik
`#8a63ff` at 0.12).

## Gradients — 22

**Per-role, 9:** `--gradient-{f}`. The engine's rule is `linear-gradient(135deg, var(--{f}-solid),
var(--{f}-solid-hover))`, but **in the 1.5.x presets every one of the nine is a flat fill**:
`linear-gradient(var(--{f}-solid), var(--{f}-solid))` — written with `var()` stops, so a scope that
re-declares `--{f}-solid` recolours the gradient too. Its label is `--{f}-on-solid` either way. Keep
using the token (`background: var(--gradient-{f})` still works and renders the solid); do not assume a
two-stop sweep.

**Composite, 13 — always pair a gradient with its `-ink`:**

| gradient | ink |
|---|---|
| `--gradient-avatar` (+ `--gradient-avatar-from`) | `--gradient-avatar-ink` |
| `--gradient-avatar-2` | `--gradient-avatar-2-ink` |
| `--gradient-avatar-3` (+ `--gradient-avatar-3-from`) | `--gradient-avatar-3-ink` |
| `--gradient-progress` | — (decorative, carries no label) |
| `--gradient-primary-info` | `--gradient-primary-info-ink` |
| `--gradient-primary-accent-pink` | `--gradient-primary-accent-pink-ink` |

`--gradient-avatar` is byte-identical in value to `--gradient-primary` (both flat primary) in 1.5.1.
Two names, two jobs, on purpose — do not collapse them. `--gradient-avatar-2` is **not** flat: it is
`linear-gradient(135deg, var(--primary-solid), var(--primary-solid-hover))`, and
`--gradient-avatar-3` runs `-from` → `--primary-solid`. (Through 1.4.1 `--gradient-avatar-2` was the one
that matched `--gradient-primary`.)

Resolved avatar/blend stops and inks — these are the values that differ between the presets:

| token | think | elemetrik |
|---|---|---|
| `--gradient-avatar-from` | `#008aff` | `#8576ff` |
| `--gradient-avatar-3-from` | `#74b3ff` | `#8678ff` |
| `--gradient-avatar-ink` / `-2-ink` | `#ffffff` | `#ffffff` |
| `--gradient-avatar-3-ink` | `#0b0f19` | `#ffffff` |
| `--gradient-primary-info-ink` | `#0b0f19` | `#0b0f19` |
| `--gradient-primary-accent-pink-ink` | `#0b0f19` | `#ffffff` |

The last two gradients are the **only** cross-family blends. **On think, `--gradient-primary-info` no
longer sweeps anything**: primary and info are the same blue (`--primary-solid` and `--info-solid` are
both `#3aa0ff` dark / `#008aff` light), so it renders one colour. On elemetrik it is violet → blue.
The ink is a fixed hex per sheet, not derived from the stops at runtime — if you re-seed either end,
re-measure the label rather than assuming it still clears.

## Status — 12

Categorical, fixed hexes, brand-independent, **absent from the light block entirely**. Each has a
`-channel` twin.

| token | value |
|---|---|
| `--status-draft` | `#94a3b8` |
| `--status-generating` | `#a855f7` |
| `--status-review` | `#f59e0b` |
| `--status-rubric` | `#0ea5e9` |
| `--status-deployed` | `#10b981` |
| `--status-closed` | `#475569` |

`--status-review` and `--warning` are the same amber today and mean different things. Keep them
separate.

## Channels — 22

Nine family channels (`--{f}-channel`, the **mark's** triple), five non-family
(`--background-channel` `--surface-channel` `--card-channel` `--fg1-channel` `--fg2-channel`), six
status channels, and two fixed overlays:

```
--white-channel: 255 255 255
--black-channel: 0 0 0
```

`UNPAIRED_CHANNEL_TOKEN_NAMES` is exactly `["--black-channel", "--white-channel"]` — they have no base
token. **There is no `--white` or `--black`.**

Use a channel only when you need an alpha the ABI does not publish:
`rgb(var(--primary-channel) / 0.3)`. If `-bg` or `-border` already gives the right alpha, use those.

## Header dropdown — 34

`--dd-amber{,-bg}` `--dd-away` `--dd-badge` `--dd-blue{,-bg}` `--dd-btn-border` `--dd-btn-label`
`--dd-busy` `--dd-cobalt{,-bg}` `--dd-desc` `--dd-green{,-bg}` `--dd-hover-bg` `--dd-hover-shadow`
`--dd-menu-label` `--dd-muted` `--dd-offline` `--dd-online` `--dd-orange{,-bg}` `--dd-panel-bg`
`--dd-red{,-bg}` `--dd-sep` `--dd-sky{,-bg}` `--dd-slate{,-bg}` `--dd-title` `--dd-title-em`
`--dd-violet{,-bg}`

**A light panel in both schemes, by design.** Zero `--dd-*` names appear in the light block, and none
of them is brandable: a control for escaping an unreadable brand must not be painted by it. Do not
"fix" it to follow the scheme.

Note the hue names here (`--dd-cobalt`, `--dd-sky`, `--dd-amber`, `--dd-violet`) are **not** the
deleted global hue families — they are a scoped, deliberately-fixed palette for this one island. They
do not resolve to a brand role and are not a precedent for using hue names anywhere else.

## Shape and type — 8

| token | dark | light |
|---|---|---|
| `--radius` | `12px` (from `PresetConfig.radius`, default 12) | `8px` |
| `--radius-chip` | `16px` | `6px` |
| `--radius-card` | `20px` | `12px` |
| `--radius-pill` | `9999px` | `9999px` |
| `--font-heading` | `'Poppins', system-ui, sans-serif` | same |
| `--font-body` | `'Poppins', system-ui, sans-serif` | same |
| `--font-mono` | `'Geist Mono', ui-monospace, monospace` | same |
| `--ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` | same |

**Radii are scheme-dependent since 1.5.0** — the light scheme uses tighter corners (8 / 6 / 12) because
the dark scheme's 20px cards "read bulky on white", and `--radius` `--radius-chip` `--radius-card` are
therefore in the light block. In the dark scheme the chip, card and pill radii step off `--radius`. The
light radii come from the shared tuning layer that `makePreset` applies to every brand, so
`PresetConfig.radius` moves the **dark** radii only (verified: `radius: 20` gave 20/24/28px dark,
still 8/6/12px light).

**Heading and body are the same face, and it is Poppins since 1.5.1** (it was Plus Jakarta Sans through
1.5.0, as it was at 1.4.1). The sheets only *name* the face — neither they nor `styles.css` load a
font file, so load Poppins yourself (or the opt-in CDN `fonts.css`, whose `buildFontsSheet()` whitelist
now includes Poppins). `buildFontsSheet()` also still lists Outfit and Plus Jakarta Sans for consumers
who set their own face to one of them; no shipped preset references either.

## Removed — these resolve to nothing, silently

74 legacy custom properties: `--mint` `--electric` `--sky` `--cobalt` `--amber` `--rose` and their
suffixed forms, plus `--cyan`, `--pink`, `--terminal-green`, `--brand-fill{,-end,-ink}`,
`--on-brand-ink`, `--{hue}-fill{,-end,-ink}`, `--accent-fill`, `--accent-glow` and `--avatar-1…6`.

No back-compat aliases, no warning. `var(--mint)` resolves to nothing, whatever fallback exists wins,
and a wrong colour ships. Guard brand-document `overrides` keys with `isTokenName()` — `schema.json`
checks them structurally only.

**Legacy names are banned, and finding one is a fix-it-now.** The complete map, the three tiers of
difficulty and the fix procedure are in [migrating.md](migrating.md); the rule and the detection
command are in [SKILL.md](../SKILL.md).

Two things this list does **not** cover, both silent:

- `--accent` `--accent-text` `--accent-border` `--gradient-primary` are valid today *and* existed
  before, with a different meaning. `isTokenName()` cannot flag them.
- `--dd-amber` `--dd-cobalt` `--dd-sky` `--dd-violet` and the rest of the `--dd-*` island are
  **current**. Hue-named on purpose. Do not migrate them.
