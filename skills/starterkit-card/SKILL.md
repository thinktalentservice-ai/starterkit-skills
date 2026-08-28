---
name: starterkit-card
description: Use when adding, restyling, reviewing or migrating any card, panel, tile, KPI/stat block, list-item surface or clickable content container in an app that uses @devopsnext/starterkit-card-component — whenever a `variant=`, `tone=` or `fill=` string is being chosen, when installing or pinning the package, and when diagnosing symptoms like a gradient card that renders as a plain grey box, an unreadable label on a gradient fill, content that shifts by 2px when the border is removed, a card that lifts under the pointer but does nothing when clicked, a `disabled` card link that still navigates, or a popover clipped off at the card's edge.
license: MIT
compatibility: React 18+ consumer, ESM or CJS. Install commands are shown for pnpm; npm and yarn work the same way. No build-time plugin or repo script is required.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-card

`@devopsnext/starterkit-card-component` is the Obsidian design-system Card. Zero runtime
dependencies, React as a peer dep, and **no styling in the component at all** — it renders data
attributes and `styles.css` selects on them.

**Design a card by picking axes, not by hunting for a variant name.**

> A `tone` publishes colour identity as CSS custom properties; a `fill` consumes them and knows
> nothing about which tone supplied them. Every mistake below is someone reintroducing a lookup
> table, a literal colour, or a JS style — and most of them ship green.

## Documented against

| | |
|---|---|
| Package version | **2.3.0** — npm `latest` on 2026-08-29, published 2026-08-25T13:56:57Z |
| Type-surface fingerprint | `971d7fd9176c` — sha256 of `dist/index.d.ts`, first 12 hex ([command](#staleness--how-to-re-derive)) |
| Source | <https://github.com/thinktalentservice-ai/starterkit-card-component> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-card-component> |
| Storybook | <https://thinktalentservice-ai.github.io/starterkit-card-component/?path=/docs/components-card--docs> |

**How much to trust each section:** the axes, presets, props, token and DOM-contract tables are
derived from `dist/index.d.ts`, `src/axes.ts`, `src/Card.tsx` and `styles.css` — authoritative.
*Choosing* and *Anti-patterns* are judgement. If the installed version has moved past 2.3.0, see
[Staleness](#staleness--how-to-re-derive) before trusting a table.

## Install — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that literal version
number*. Do not install a range, and do not assume the version this file documents is still latest.

**Step 1 — ask the registry what latest is.** Either of these; the CLI is preferred because you can
paste its answer straight into step 2:

```bash
npm view @devopsnext/starterkit-card-component version
```

Or read it off the package page — the version is at the top right:
<https://www.npmjs.com/package/@devopsnext/starterkit-card-component>
(`npm view @devopsnext/starterkit-card-component versions --json` lists every published version if
you need to see the history.)

**Step 2 — install that exact number**, substituting whatever step 1 returned:

```bash
pnpm add @devopsnext/starterkit-card-component@<version-from-step-1>
```

At the time this file was written step 1 answered `2.3.0`, so step 2 was:

```bash
pnpm add @devopsnext/starterkit-card-component@2.3.0
```

`package.json` must end up holding the bare number — `"@devopsnext/starterkit-card-component":
"2.3.0"`. **Open it and check.** If your client widened it to `"^2.3.0"`, re-add with
`--save-exact` (npm/pnpm) or `--exact` (yarn).

**Why not just `@latest`.** It installs the same code, but every client writes a **caret** range
instead of the number. A caret lets a later minor bump change how every card on the screen renders
with no review and no diff, and it fails any `pinned === installed` check. Same for `@^2`, `@~2.3`,
`@*` and a bare `pnpm add <pkg>` — all of them record a range. The point of step 1 is not to avoid
new versions; it is to take the newest one **deliberately**, on a line someone can review.

Upgrading later is the same two steps: re-run step 1, and if the number moved, re-run step 2 with it
and then work through [Staleness](#staleness--how-to-re-derive) before trusting the tables here.

Import the stylesheet **once**, at the app root — the root layout, `_app`, or your entry module:

```jsx
import "@devopsnext/starterkit-card-component/styles.css";
```

Never import it again from a component. Peer deps: `react` and `react-dom` >= 18. The package is
`type: module` and ships both `import` and `require` entries plus types.

```jsx
import { Card } from "@devopsnext/starterkit-card-component";
```

## See it rendered — the live Storybook

Public, no login. This is the only place the *rendered* result of an axis combination is visible; the
tables below tell you what is legal, the Storybook tells you what it looks like.

<https://thinktalentservice-ai.github.io/starterkit-card-component/?path=/docs/components-card--docs>

| Story id | Shows |
|---|---|
| `components-card--docs` | the whole design contract, rendered |
| `components-card--axis-matrix` | every tone × fill in one grid — **use this to pick** |
| `components-card--presets` | what each `variant` alias actually looks like |
| `components-card--padding` | `none` / `sm` / `md` / `lg` side by side |
| `components-card--states` | interactive, clickable, disabled, focus, accent strip |
| `components-card--cross-family-gradients` | the composite gradients `tone` has no slot for |
| `components-card--on-a-coloured-surface` | how the fills read on a non-default background |
| `components-card--composition` | Card + product content — the KPI / feature shape |
| `components-card--brand-comparison` | two brands side by side |
| `components-card--playground` | the args table, for poking one card |

Deep-link with `?path=/docs/components-card--<id>` (or `/story/…` for a non-docs story);
`…/iframe.html?id=<id>&viewMode=docs` renders one bare. `?globals=brand:elemetrik;scheme:dark`
reproduces any of the brand/scheme states as a shareable link — the decorator writes those
attributes to `<html>`, not to the story wrapper. The machine-readable story list is `…/index.json`.

**Use the Storybook for appearance only.** Its ArgsTable is unreliable — see the gap noted under
[Staleness](#staleness--how-to-re-derive).

## The three axes

There is no variant lookup table. Every visual decision belongs to exactly one axis, so a new tone
costs one CSS rule and combines with every fill for free.

| Axis | Values | Default |
|---|---|---|
| `tone` | `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink` `neutral` | `neutral` |
| `fill` | `glass` `surface` `elevated` `gradient` `outline` | `glass` |
| `pad` | `none` `sm` `md` `lg` → `0` / `16px` / `24px` / `32px 28px` | `md` |

10 × 5 = 50 reachable cells. A `tone` publishes `--ic-ch` (an `r g b` channel triplet), `--ic-grad`,
`--ic-ink` (the family's **measured** on-solid ink), `--ic-mark` (its border-ready colour) and
`--ic-hover-bg`; a `fill` reads them.

**The one non-universal cell:** `neutral` publishes no gradient, so `fill="gradient" tone="neutral"`
would be an invisible box with white text on the page background. It **degrades to `surface`**
rather than disappearing. If a gradient card is rendering as a plain grey panel, that is this rule —
you did not pick a role tone.

`neutral` also splits identity from interaction deliberately: it draws its outline and focus ring
from `--fg1-channel` (grey is what "no colour chosen" should look like) but **hovers in `primary`** —
except `fill="elevated"`, which hovers in `secondary`. Elevated is the modal/popover level, and the
hue is what separates *this surface is on top of the page* from *it is part of it*. A **toned**
elevated card still hovers in its own tone; only the no-tone-chosen default differs.

### Presets (`variant`)

A named alias for a point in axis space — **never a second styling API**. `variant="primary"` and
`tone="primary" fill="gradient"` produce byte-identical DOM.

| `variant` | equals |
|---|---|
| `glass` | `tone=neutral fill=glass` |
| `surface` | `tone=neutral fill=surface` |
| `elevated` | `tone=neutral fill=elevated` |
| `outline` | `tone=neutral fill=outline` |
| `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink` | `tone=<same>` `fill=gradient` |

**Explicit axis prop beats the preset; the preset beats the default — resolved per axis,
independently.** An unknown `variant` degrades to the defaults and warns **dev-only, once per bad
value**. In production `variant="dnager"` renders a normal glass card, silently.

## Choosing

| Job | Write |
|---|---|
| Default content panel over the app background | `<Card>…</Card>` — the defaults are already `neutral`/`glass` |
| A flat, opaque block — forms, tables, dense data | `fill="surface"` |
| Something that must sit visibly above its neighbours | `fill="elevated"` |
| A quiet container that only needs an edge | `fill="outline"` |
| A featured / hero / "this one matters" tile | `fill="gradient"` + a role `tone` |
| Status-carrying tile (failed, at risk, healthy) | `tone="danger"`, `"warning"` or `"success"` with `fill="outline"` — colour the **edge**, not the whole surface |
| Media card, image bleeding to the corners | `pad="none"` |
| Cards that must line up in a grid row | `fullHeight` |
| A card that navigates | `href="…"` (renders an `<a>`) |

Three rules that keep a screen coherent:

- **`gradient` is a spotlight. One per view, at most.** A grid where everything shouts emphasises
  nothing.
- **Hold `fill` across a set, vary `tone`.** A status grid where every tile is `outline` and only the
  tone moves reads instantly. The reverse does not.
- **Gradient fills are for headings and short labels.** Body copy on a gradient is a legibility
  gamble even with the measured ink.

## Other props

| Prop | Notes |
|---|---|
| `interactive` | Hover **and** focus lift. Defaults to `true` for a clickable card (`onClick` or `href`) and `false` otherwise — a card that moves under the pointer but does nothing when clicked is a lie about affordance. |
| `accent` | Top accent strip, any CSS colour string. Drawn as a `::before` pseudo-element, **not** a `border-top`, so a hover `border-color` change cannot wipe it. Emits `data-accent` and sets `--ic-accent`. |
| `noBorder` | Border goes **transparent**, not `none`. Dropping it would shrink the box by 2px and shift everything inside. |
| `fullHeight` | `height: 100%`, for cards that must line up in a grid row. |
| `disabled` | Only meaningful on a clickable card: blocks activation, removes it from the tab order, announces the state. A non-clickable card ignores it. |
| `as` | `div` (default) `article` `section` `aside` `li`. **Ignored when `href` is set.** |
| `href` | Renders `<a>`. The prop type is **discriminated**: with `href` you get `target`/`rel`/`download` and `as` is forbidden; without it you get `as`. Mixing them is a compile error, not a silently ignored prop. |
| `onClick` | Gives the card `role="button"`, a tab stop, and Enter/Space activation. |
| `className` | Merged onto `ic-card`. |
| `ref` | Forwarded to the underlying node. Required by MUI Tooltip/Menu/Popper, focus management and scroll-into-view. |

Anything else is spread onto the underlying element.

**Two things worth an hour of debugging, and in no ArgsTable:**

- A `disabled` **anchor** is inert *by construction*. `<a>` ignores the `disabled` attribute, so the
  component drops `href` and `onClick`, sets `role="link" aria-disabled="true" tabIndex={-1}`, and
  kills `pointer-events` in CSS. Those props are spread **last**, so a caller-supplied `tabIndex` or
  `onClick` cannot resurrect it. That is the intended behaviour, not a bug to work around.
- The card sets `overflow: hidden` to clip the accent strip to the corner radius. **A card cannot
  host an overflowing popover, menu or tooltip** — render those through a portal, as with any
  clipped box.

## Rendered DOM contract

`class="ic-card …"` plus `data-tone`, `data-fill`, `data-pad` **always**; `data-interactive` when the
card lifts and is not disabled; `data-accent` when an accent strip is set; `data-no-border` and
`data-full-height` when those props are on. `data-interactive` is **state, not style** — every hover
and focus rule is gated on it, which is why it exists.

Never select on these from app CSS and never restyle `.ic-card` — see the namespace rule below.

## Design-system rules this card inherits

These hold for every `@devopsnext/starterkit-*` package. They are inlined here so this skill stands
alone.

**1. Roles, not hues.** Nine semantic roles — job names — plus `neutral`, in this order:
`primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink`.
`info`, `accent-green` and `accent-pink` are **fixed categorical** roles, byte-identical in every
brand. `accent` is the *active brand's* accent and may coincide with a fixed one — that overlap is
intended, do not deduplicate it. MUI's `error` intention maps to **`danger`**; there is no `--error-*`
token. Never pick a role for its colour: if you want green because green looks nice, you want
`success` when the thing is succeeding, or the brand's `accent` when it is the brand's accent.

The old hue families are **gone and fail silently**: `mint` `electric` `sky` `cobalt` `amber` `rose`,
plus `--cyan`, `--pink`, `--terminal-green`, `--brand-fill` and `--on-brand-ink`. There are
deliberately no back-compat aliases and there is no warning — `var(--mint)` resolves to nothing,
whatever fallback exists wins, and a wrong colour ships. See
[Migration](#migration-hue-names-are-gone).

**2. Your token source is primary; `styles.css` is the backup.** Every token the component reads is
aliased once on `.ic-card` as `var(--your-token, <vendored default>)` — for example
`--ic-t-glass-bg: var(--glass-bg, rgba(255,255,255,0.035))`. A CSS fallback applies only to an
*absent* custom property, so wherever you define the token it wins — no import order to get right,
no `@layer`, nothing to load first. `styles.css` declares **nothing on `:root`**, imports nothing and
makes no network request; aliasing on `.ic-card` keeps the blast radius at this component. Its rules
are deliberately **unlayered** so they beat unlayered global resets such as Bootstrap's or Tailwind's
preflight — but unlayered only wins where the selector is *more specific*. Against an
equal-specificity rule the cascade falls through to source order, so write compound selectors
(`.my-wrap.card-grid`, not `.my-wrap`) when a framework class is also present.

**3. Never hardcode ink over a brand fill.** `--{role}-on-solid` is a **measured** ink — `#0b0f19`
or `#ffffff`, whichever scores better against the *worse* of the family's resting and hovered fill —
and it is per brand. The card exposes it as `--ic-ink`, and a gradient fill uses
`color: var(--ic-on-grad, var(--ic-ink))`. A literal `#fff` label is a rendered WCAG failure that no
token audit can see, because a literal inside a component is invisible to one.

**4. Colour scheme goes on `<html>`, nowhere else.** `data-mui-color-scheme` is the ABI;
`[data-theme="light"]` on any ancestor is matched as a second selector; with neither present,
`prefers-color-scheme` decides. The scheme-dependent parts of this package — the vendored token
defaults, the glow alphas and the depth colours — all flip on those three, so a scheme attribute set
somewhere other than `<html>` leaves a card lit for the wrong scheme.

**5. Do not restyle the `.ic-*` namespace.** It is package-owned. Restyle by overriding a **token**,
never by writing a rule against the package's class or its `data-*` attributes — those are a
selection contract between the component and its own stylesheet, and a rename upstream stops every
rule you wrote from matching, with no type error.

**6. Never drive hover, focus or press from JS.** The package removed exactly this and will not take
it back: `onMouseOver`/`onMouseOut` drops events during fast pointer movement or a re-render
mid-hover and leaves the card stuck in its lifted state; `:focus-visible` is impossible in JS,
because `onFocus` fires for mouse clicks too, so a JS focus ring punishes mouse users while telling
you nothing about keyboard navigation; and a lift written in JS cannot be turned off by
`prefers-reduced-motion`. Moving to CSS was an accessibility fix, not a refactor.

## Tokens this package owns

- `--ic-card-focus-ring` — focus ring colour. Unset by default; the ring falls back to
  `rgb(var(--ic-hover-ch))`, or to the measured `--ic-ink` on a toned gradient, because a same-hue
  ring on a same-hue gradient is invisible.
- `--ic-on-grad` — label ink on a gradient fill. Defaults to `--ic-ink`, the tone's **measured**
  `--{role}-on-solid`. Setting it mostly restates what the theme already computed; reach for it only
  when body copy on one specific gradient needs a different contrast strategy. Never hardcode — rule 3.
- `--ic-glow-a` / `--ic-glow-a-far` / `--ic-glow-a-hover` — glow alphas, `0.35 / 0.12 / 0.45` dark
  and `0.20 / 0.06 / 0.28` light. Only the alpha is scheme-dependent: the same 0.35 that reads as a
  halo on the void surface reads as a smear on white. Every glow derives from the card's own tone
  channel rather than a per-family glow constant, which is what makes `tone="danger"` cost zero new
  CSS and covers `neutral`, which has no family constant at all.
- `--ic-depth-soft` / `--ic-depth` / `--ic-depth-deep` — drop-shadow colours under a lifted card.
  Three, not one: the cast is graded by how far off the page that fill sits, and collapsing them
  flattens the ordering the fills exist to express.

### Cross-family gradients

Two composite tokens exist that `tone` has no slot for, because they blend a role with `primary`
rather than with itself. Reach them through the accent strip:

```jsx
<Card fill="glass" accent="var(--gradient-primary-info)" interactive>…</Card>
<Card fill="glass" accent="var(--gradient-primary-accent-pink)" interactive>…</Card>
```

## Compositions, not variants

A KPI tile or a feature tile is **Card plus product content**, and it belongs in your app, not in a
new `variant`. Build one the way the design system's own reference implementations do — they live in
the Next.js starter template under `src/components/cards/` (`KpiCard.jsx`, `FeatureCard.jsx`) if you
have that checkout, but the recipe is the point and stands without it:

- **Read the tone's identity channel instead of restating a colour.** `rgb(var(--ic-ch))` is
  published on `.ic-card` and inherited by every descendant, so a strip, icon or trend arrow follows
  `tone` automatically and costs nothing when the tone changes.
- **Derive tints with `color-mix(in srgb, <colour> 13%, transparent)`** — works on a `var()` or a hex.
- **Pass an `accent` that agrees with the `tone`.** Hover and glow always follow `tone`, so an accent
  that disagrees re-creates exactly the mismatch the axis model exists to kill.

**There is no skeleton or loading state, deliberately.** A card does not know the shape of what it is
waiting for, so a useful skeleton has to be composed too.

## Accessibility — already handled, do not undo

- **Every hover rule is also a `:focus-visible` rule.** A keyboard user reaching a card sees the same
  state change a mouse user gets. `:focus-visible`, not `:focus`, so a mouse click leaves no ring.
- **A clickable card is `div[role="button"]`, never a real `<button>`** — a button may not contain
  interactive descendants, and cards routinely hold links, menus and their own buttons. The native
  behaviour is written out by hand: Enter activates on keydown, Space on keyup (that is the native
  split — holding Space on a button fires nothing until release), Space is `preventDefault`-ed so the
  page does not scroll, and both branches are gated on `event.target === event.currentTarget` so a
  keypress originating in a nested control never also activates the card.
- **`aria-disabled` is the whole contract** — a card is never a `<button>` or an `<input>`, so
  `:disabled` can never match it. The component also drops the `href` and the click handler, and CSS
  kills `pointer-events` so the pointer cannot reach a nested control inside a dead card.
- **`prefers-reduced-motion`** removes the lift and keeps the colour and shadow change — that is the
  part that says *focused* rather than the part that moves.
- **`forced-colors`** restores a system `CanvasText` border (the OS drops gradients, alpha washes and
  shadows, which would leave every fill as the same flat rectangle) and redraws the accent strip in
  `Highlight`. No `forced-color-adjust` override — the user's palette wins.

## Copy-paste patterns

```jsx
// Default content panel
<Card>…</Card>

// Dense data surface
<Card fill="surface" pad="lg">…</Card>

// Featured tile — one per view
<Card variant="accent" pad="lg"><h3>Automated reconciliation</h3></Card>

// Status grid — hold the fill, move the tone
{items.map((i) => (
  <Card key={i.id} tone={i.tone} fill="outline" pad="sm" fullHeight>…</Card>
))}

// Clickable card in a feed — the lift turns itself on
<Card as="article" fill="surface" onClick={() => open(id)}>…</Card>

// Navigational card
<Card href={`/reports/${id}`} fill="elevated">…</Card>

// Media card — image bleeds to the corners
<Card pad="none" fill="surface">
  <img src={src} alt="" style={{ width: "100%", display: "block" }} />
</Card>

// Accent strip following the brand
<Card fill="glass" accent="var(--primary)" interactive>…</Card>
```

## Migration: hue names are gone

Rule 1 has the general background. Card-specific: the pre-2.0 `variant` list was
`glass | surface | elevated | cobalt | violet | mint | amber`, which quietly mixed two unrelated
decisions — *how the surface is treated* and *which hue fills it*. A list like that grows a row per
screenshot: there was no `danger` card because nobody had needed one, and no way to get a toned
outline at all. The axes replaced it.

There are **no back-compat aliases**, and this is **not** a 1:1 relabelling — nearest neighbours
only, none of them a guaranteed visual match:

| Old | Was | Nearest now |
|---|---|---|
| `mint` | `palette.primary.main` | `primary` — but review it; `accent` or `success` may be what you meant |
| `cobalt` | `palette.info.main` | `info` — though `primary` inherited cobalt's *slot* |
| `violet` | `palette.secondary.main` | `secondary` — now a neutral slate, not violet |
| `amber` | — | `warning` |
| `danger` | — | `danger` (unchanged) |

`glass` / `surface` / `elevated` / `outline` are unchanged. `info`, `accent-green` and `accent-pink`
are not part of the rename — new roles, with no old hue word to trace back to. A silent
`mint → primary` fallback is how two vocabularies survive a rename forever, which is why there
isn't one: an old name gets a dev-only warning and the default card, and you have to look at it.

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| `variant="mint"` / `"cobalt"` / `"violet"` | Removed; degrades to the defaults with a dev-only warning | pick a role and review the result |
| `fill="gradient" tone="neutral"` | `neutral` publishes no gradient; degrades to `surface` | pick a role tone, or use `fill="surface"` outright |
| A grid of `gradient` cards | Everything shouting is nothing emphasised | one gradient, the rest `glass`/`outline` |
| `style={{ background: "#0099ff" }}` | Pins one brand's blue; breaks under the next brand | `tone="primary"` |
| `color: #fff` on a gradient card | Measured ink is per brand — rule 3 | let `--ic-on-grad` default |
| `interactive` on a card with no click target | Lies about affordance | leave it off; it turns itself on when clickable |
| Padding on a media card's `<img>` wrapper | An image cannot bleed from inside padding | `pad="none"` |
| `border: none` to drop the border | Shrinks the box 2px and shifts the content | `noBorder` |
| A real `<button>` wrapping card content | A button may not contain interactive descendants | `onClick` on the `Card` |
| A dropdown or tooltip rendered inside a card | The card sets `overflow: hidden` to clip its accent strip | render it through a portal |
| Restyling `.ic-card` or selecting on `data-fill` in app CSS | Package namespace and selection contract | override a token |
| `onMouseOver` styling on a wrapper | Rule 6 | CSS, or nothing — the package already does it |

**The one that has no warning at all:** an unknown **`tone`**. Unlike `variant`, `resolveAxes` passes
a bad `tone` straight through to `data-tone`, it matches no CSS rule, and the card falls back to the
base neutral channel — a plausible-looking wrong answer. TypeScript catches it; a plain-JS caller
gets nothing. If you consume this from JS behind a wrapper, a `PropTypes.oneOf([...roles])` on that
wrapper is the only dev signal a typo will ever get. It does nothing in production — treat it as a
development guard, not a runtime guarantee.

## Staleness — how to re-derive

This file documents 2.3.0. Nothing enforces that; check it. Compare three numbers — what the registry
publishes, what `package.json` pins, and what is actually installed:

```bash
npm view @devopsnext/starterkit-card-component version
```

```bash
npm ls @devopsnext/starterkit-card-component
```

They should all match, and the `package.json` entry should be a bare number with no `^` or `~` —
see [Install](#install--always-the-latest-version-always-pinned-exactly).

The fingerprint in the table at the top is the first 12 hex of the sha256 of the installed
`dist/index.d.ts`. Reproduce it:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-card-component'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

**Do not "simplify" either of those to `require('@devopsnext/starterkit-card-component/package.json')`.**
The package's `exports` map declares only `.` and `./styles.css`, so any subpath — `package.json`
included — throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Resolving the main entry and walking to its
sibling is the way in, and it is layout-independent: it works under npm, pnpm and yarn alike.

`971d7fd9176c` means the type surface is the one these tables describe, whatever the version number
says. A version bump that leaves the fingerprint alone moved the version and nothing else.

If the fingerprint has moved, re-derive **before** trusting a table, in this order:

1. `node_modules/@devopsnext/starterkit-card-component/dist/index.d.ts` — the authoritative axis
   unions, the `PRESETS` map and the discriminated `CardProps`. **This is what the fingerprint
   hashes.**
2. `node_modules/@devopsnext/starterkit-card-component/styles.css` — pad values, the
   `neutral`-gradient degrade, the glow alphas and every token alias. Heavily commented; the comments
   carry the reasoning, not just the values.
3. `node_modules/@devopsnext/starterkit-card-component/README.md` — the design contract and the
   migration reasoning.
4. The [Storybook](#see-it-rendered--the-live-storybook) for the rendered result — *Axis Matrix*
   first, then *Cross Family Gradients*, *On A Coloured Surface*, *Composition* and *Brand
   Comparison*. Its current story list is always `…/index.json`.
5. The source repo, <https://github.com/thinktalentservice-ai/starterkit-card-component> —
   `src/axes.ts`, `src/Card.tsx`, `styles.css`.

**Known documentation gap:** the published Storybook's ArgsTable shows `-` in every Default cell —
including `interactive`, whose conditional default is the most surprising behaviour in the API —
gives `as` no type or control, and states no package version. Types come from `dist/index.d.ts`;
defaults come from this file.

## Red flags — stop

- About to run `pnpm add …@latest`, `@^2`, `@~2.3` or a bare `pnpm add <pkg>` → all of them record a
  **range**. Look up the latest version, then install that literal number.
- `package.json` shows `"^2.3.0"` rather than `"2.3.0"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry → check first; the
  latest may have moved past 2.3.0.
- A "gradient" card is rendering as a plain grey panel → `tone` is `neutral`; it degraded to `surface`.
- About to write a literal `#fff` (or any hex) as a label colour on a gradient fill → rule 3.
- About to add a CSS rule for `.ic-card` or `[data-fill="…"]` in app styles → override a token.
- About to reach for `mint`, `cobalt`, `violet`, `amber` or any other hue name → it degrades to the
  default card, and only in dev does it say so.
- About to write `onMouseOver` hover styling → rule 6.
- About to set `interactive` on a card with nothing to click → leave it off.
- About to use `border: none` to hide the border → `noBorder`; `none` reflows the content.
- A menu or tooltip inside a card is being clipped → that is `overflow: hidden`; use a portal.
- About to import `styles.css` from a component → it belongs once, at the app root.
- Storybook ArgsTable says a prop's default is `-` → read this file instead.
