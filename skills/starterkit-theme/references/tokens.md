# Token inventory — `@devopsnext/starterkit-theme` 1.4.1

Companion to [SKILL.md](../SKILL.md). This is the full `ROOT_TOKEN_NAMES` set with resolved values,
for diffing when the drift check fires. Read the decision table in SKILL.md before picking from here —
this file tells you what exists, not what it owes.

**Verified against the published 1.4.1 tarball**, `presets/think.css` and `presets/elemetrik.css`.

```
TOKENS_VERSION      9451b3ea404a
ROOT_TOKEN_NAMES    205
LIGHT_TOKEN_NAMES   100   (the only names restated in the light block)
CHANNEL_TOKEN_NAMES  22
PROVENANCE          --tokens-version, --tokens-brand  (emitted only with serializeBrandCss({ provenance }))
```

Regenerate the counts with:

```bash
node -p "const t=require('@devopsnext/starterkit-theme'); [t.TOKENS_VERSION, t.ROOT_TOKEN_NAMES.length, t.LIGHT_TOKEN_NAMES.length].join(' ')"
```

## Family tokens — 8 per role × 9 roles = 72

For every `{f}` in `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green`
`accent-pink`:

`--{f}` `--{f}-text` `--{f}-solid` `--{f}-solid-hover` `--{f}-on-solid` `--{f}-bg` `--{f}-border`
`--{f}-channel`

Plus, per role, `--gradient-{f}`, `--glow-{f}` and `--shadow-btn-{f}` (counted under their own groups
below).

`-bg` and `-border` are alphas of the **mark** — `-bg` 0.14 dark / 0.10 light, `-border` 0.42 dark /
0.36 light — so they are derivable from `--{f}-channel` and are not listed with hex values here.

### Resolved values

`=` means the light block does not restate the token: it is scheme-invariant.

| token | think dark | think light | elemetrik dark | elemetrik light |
|---|---|---|---|---|
| `--primary` | `#37a3fe` | `#2775b4` | `#6832ff` | `#3e18a8` |
| `--primary-text` | `#59b3ff` | `#1b5686` | `#7e79ee` | `#260071` |
| `--primary-solid` | `#007acd` | = | `#6832ff` | = |
| `--primary-solid-hover` | `#0171bf` | = | `#612fed` | = |
| `--primary-on-solid` | `#ffffff` | = | `#ffffff` | = |
| `--secondary` | `#64748b` | `#3e4959` | `#64748b` | `#3e4959` |
| `--secondary-text` | `#738296` | `#252d39` | `#738296` | `#252d39` |
| `--secondary-solid` | `#64748b` | = | `#64748b` | = |
| `--secondary-solid-hover` | `#5d6c82` | = | `#5d6c82` | = |
| `--secondary-on-solid` | `#ffffff` | = | `#ffffff` | = |
| `--accent` | `#b3d335` | `#6c7d2c` | `#ee4480` | `#a52f5a` |
| `--accent-text` | `#c8e063` | `#576328` | `#f26594` | `#771d3e` |
| `--accent-solid` | `#b3d335` | = | `#ee4480` | = |
| `--accent-solid-hover` | `#a6c333` | = | `#dc4078` | = |
| `--accent-on-solid` | `#0b0f19` | = | `#0b0f19` | = |
| `--success` | `#4caf50` | `#397a36` | same | same |
| `--success-text` | `#6eba67` | `#255925` | same | same |
| `--success-solid` | `#4caf50` | = | same | = |
| `--success-solid-hover` | `#47a24c` | = | same | = |
| `--success-on-solid` | `#0b0f19` | = | same | = |
| `--warning` | `#f59e0b` | `#b57620` | same | same |
| `--warning-text` | `#feb054` | `#8a5a19` | same | same |
| `--warning-solid` | `#f59e0b` | = | same | = |
| `--warning-solid-hover` | `#e2930c` | = | same | = |
| `--warning-on-solid` | `#0b0f19` | = | same | = |
| `--danger` | `#f43f5e` | `#a92b43` | same | same |
| `--danger-text` | `#f86278` | `#7a1a2c` | same | same |
| `--danger-solid` | `#f43f5e` | = | same | = |
| `--danger-solid-hover` | `#e13b58` | = | same | = |
| `--danger-on-solid` | `#0b0f19` | = | same | = |
| `--info` | `#236cd3` | `#00357d` | same | same |
| `--info-text` | `#4f81cd` | `#001c4b` | same | same |
| `--info-solid` | `#0058d4` | = | same | = |
| `--info-solid-hover` | `#0152c5` | = | same | = |
| `--info-on-solid` | `#ffffff` | = | same | = |
| `--accent-green` | `#b3d335` | `#6c7d2c` | same | same |
| `--accent-green-text` | `#c8e063` | `#576328` | same | same |
| `--accent-green-solid` | `#b3d335` | = | same | = |
| `--accent-green-solid-hover` | `#a6c333` | = | same | = |
| `--accent-green-on-solid` | `#0b0f19` | = | same | = |
| `--accent-pink` | `#ee4480` | `#a52f5a` | same | same |
| `--accent-pink-text` | `#f26594` | `#771d3e` | same | same |
| `--accent-pink-solid` | `#ee4480` | = | same | = |
| `--accent-pink-solid-hover` | `#dc4078` | = | same | = |
| `--accent-pink-on-solid` | `#0b0f19` | = | same | = |

Three things to read out of that table:

1. **`--primary-solid` on think is `#007acd`, not the seed `#37a3fe`.** Only `primary` is floored, and
   only to clear 4.5:1 against white. `--primary-solid-hover` is then derived from the *floored* fill.
2. **`--{f}-on-solid` is `#ffffff` on `primary`, `secondary` and `info`, and `#0b0f19` on the other
   six.** It is measured, per brand, per family. Never guess it.
3. **`accent` duplicates a fixed categorical role in both presets** — `accent-green` on think,
   `accent-pink` on elemetrik. Intended. Do not deduplicate.

## Surfaces and neutrals — 27

Identical across both presets.

| token | dark | light |
|---|---|---|
| `--void` | `#07080f` | `#e8eaf2` |
| `--background` | `#0d0f1a` | `#f6f7fb` |
| `--surface` | `#10121c` | `#ffffff` |
| `--surface-elevated` | `#161925` | `#f0f1f7` |
| `--sidebar-bg` | `#09091a` | `#eef0f8` |
| `--card` | `#12141f` | `#ffffff` |
| `--fg1` | `#f0f2ff` | `#1a1d2e` |
| `--fg2` | `#8b93b5` | `#5a6080` |
| `--fg-muted` | `rgba(255,255,255,0.45)` | `rgba(0,0,0,0.45)` |
| `--fg-muted-min` | `rgba(255,255,255,0.38)` | `rgba(0,0,0,0.38)` |
| `--fg-disabled` | `rgba(255,255,255,0.28)` | `rgba(0,0,0,0.28)` |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.14)` |
| `--glass-border` | `rgba(255,255,255,0.09)` | `rgba(0,0,0,0.14)` |
| `--glass-bg` | `rgba(255,255,255,0.035)` | `rgba(255,255,255,0.72)` |
| `--glass-bg-card` | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.60)` |
| `--glass-dark-bg` | `rgba(0,0,0,0.25)` | `rgba(0,0,0,0.06)` |
| `--hover-overlay` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.04)` |
| `--topbar-bg` | `rgba(7,8,15,0.85)` | `rgba(255,255,255,0.92)` |
| `--input` | `rgba(255,255,255,0.10)` | **`transparent`** — a keyword, not a colour |
| `--input-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.15)` |
| `--input-border-hover` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.25)` |
| `--input-disabled-bg` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.04)` |
| `--input-disabled-border` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.10)` |
| `--btn-outline-border` | `rgba(255,255,255,0.34)` | `rgba(0,0,0,0.24)` |
| `--btn-outline-border-hover` | `rgba(255,255,255,0.55)` | `rgba(0,0,0,0.42)` |
| `--btn-ghost-bg` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.03)` |
| `--btn-ghost-bg-hover` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.06)` |

`--input`'s light value being the keyword `transparent` catches anyone who tries to `color-mix()` or
parse it. Handle it.

## Focus — 1

| token | think dark | think light | elemetrik dark |
|---|---|---|---|
| `--ring` | `rgba(55,163,254,0.40)` | `rgba(55,163,254,0.30)` | `rgba(104,50,255,0.40)` |

Alpha of the primary **seed**, not the floored `--primary-solid` — deliberately, so the focus ring
keeps the brand's own blue rather than the darkened fill. Same hue across both schemes; the **alpha**
differs (0.40 / 0.30), so it does appear in the light block.

## Depth — 4 neutral + 9 glow + 9 button = 22

**Neutral, not scaled by `intensity`** (they are depth cues, not brand): `--shadow-card`
`--shadow-card-hover` `--shadow-elevated` `--shadow-dropdown`.

**Brand, scaled by `intensity`:**

- `--glow-{f}` — two layers, `0 0 20px` @ 0.35 dark / 0.20 light and `0 0 60px` @ 0.12 / 0.06,
  coloured by the **mark**.
- `--shadow-btn-{f}` — one layer, `0 4px 20px` @ 0.40 dark / 0.30 light, coloured by the **seed
  fill**.

Nine of each, one per role. `intensity: 0` flattens every coloured one at once and leaves the four
neutral drop-shadows intact.

## Gradients — 22

**Per-role, 9:** `--gradient-{f}` = `linear-gradient(135deg, var(--{f}-solid), var(--{f}-solid-hover))`.
Its label is `--{f}-on-solid` by construction.

**Composite, 13 — always pair a gradient with its `-ink`:**

| gradient | ink |
|---|---|
| `--gradient-avatar` (+ `--gradient-avatar-from`) | `--gradient-avatar-ink` |
| `--gradient-avatar-2` | `--gradient-avatar-2-ink` |
| `--gradient-avatar-3` (+ `--gradient-avatar-3-from`) | `--gradient-avatar-3-ink` |
| `--gradient-progress` | — (decorative, carries no label) |
| `--gradient-primary-info` | `--gradient-primary-info-ink` |
| `--gradient-primary-accent-pink` | `--gradient-primary-accent-pink-ink` |

`--gradient-avatar-2` is byte-identical in value to `--gradient-primary`. Two names, two jobs, on
purpose — do not collapse them.

The last two are the **only** cross-family blends. One ink has to cover both stops of a
primary→info sweep, which is why `info`'s seed sits at `#0058d4` rather than colliding with think's
primary: the rotation opened that sweep from ~2° of hue to ~10° and let white clear AA across the
whole blend. Think's margin there is thin. A one-byte shift in either seed can reopen it — re-measure
rather than assuming.

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

| token | value |
|---|---|
| `--radius` | `12px` (from `PresetConfig.radius`, default 12) |
| `--radius-chip` | `16px` |
| `--radius-card` | `20px` |
| `--radius-pill` | `9999px` |
| `--font-heading` | `'Plus Jakarta Sans', system-ui, sans-serif` |
| `--font-body` | `'Plus Jakarta Sans', system-ui, sans-serif` |
| `--font-mono` | `'Geist Mono', ui-monospace, monospace` |
| `--ease-entrance` | `cubic-bezier(0.16, 1, 0.3, 1)` |

The chip, card and pill radii step off `--radius`; move `PresetConfig.radius` and all four move.

**Heading and body are the same face.** Outfit is no longer referenced by any shipped preset — the
only surviving mention in the package is `buildFontsSheet()`, which still fetches it for consumers who
set their own heading face to it.

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
