---
name: starterkit-button
description: Use when adding, restyling, reviewing or migrating any button, CTA, action row, toolbar control or link-styled-as-button in an app that uses @devopsnext/starterkit-button-component — whenever a `variant=`, `tone=` or `fill=` string is being chosen, when installing or pinning the package, and when diagnosing symptoms like a button rendering plain grey, a white label that is unreadable on a brand fill, a translucent button that disappears on a light page, a `disabled` link that will not navigate, or hover styling written in JS.
license: MIT
compatibility: React 18+ consumer, ESM or CJS. Install commands are shown for pnpm; npm and yarn work the same way. No build-time plugin or repo script is required.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-button

`@devopsnext/starterkit-button-component` is the Obsidian design-system Button. Zero runtime
dependencies, React as a peer dep, and **no styling in the component at all** — it renders data
attributes and `styles.css` selects on them.

**Design a button by picking axes, not by hunting for a variant name.**

> A `tone` publishes colour identity as CSS custom properties; a `fill` consumes them and knows
> nothing about which tone supplied them. Every mistake below is someone reintroducing a lookup
> table, a literal colour, or a JS style — and most of them ship green.

## Documented against

| | |
|---|---|
| Package version | **2.8.2** — npm `latest` on 2026-11-20, published 2026-11-18T12:23:02Z |
| Type-surface fingerprint | `739f1028e93a` — sha256 of `dist/index.d.ts`, first 12 hex ([command](#staleness--how-to-re-derive)). Identical for every published version from 2.1.0 through 2.8.2, so 2.4.0 → 2.8.2 changed the look in `styles.css` and nothing in the types. |
| Token defaults | Vendored in `styles.css`, synced from `@devopsnext/starterkit-theme` 1.5.0 (`presets/think.css`) — a **devDependency** of the package, not something a consumer must install |
| Peer deps | `react` and `react-dom` `>=18` — unchanged since 2.3.0 |
| Source | <https://github.com/thinktalentservice-ai/starterkit-button-component> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-button-component> |
| Storybook | <https://thinktalentservice-ai.github.io/starterkit-button-component/?path=/docs/components-button--docs> |

**How much to trust each section:** the axes, presets, props and DOM-contract tables are derived from
`dist/index.d.ts`, `src/axes.ts` and `styles.css` — authoritative. *Choosing* and *Anti-patterns* are
judgement. If the installed version has moved past 2.8.2, see [Staleness](#staleness--how-to-re-derive)
before trusting a table.

## Install — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that literal version
number*. Do not install a range, and do not assume the version this file documents is still latest.

**Step 1 — ask the registry what latest is.** Either of these; the CLI is preferred because you can
paste its answer straight into step 2:

```bash
npm view @devopsnext/starterkit-button-component version
```

Or read it off the package page — the version is at the top right:
<https://www.npmjs.com/package/@devopsnext/starterkit-button-component>
(`npm view @devopsnext/starterkit-button-component versions --json` lists every published version if
you need to see the history.)

**Step 2 — install that exact number**, substituting whatever step 1 returned:

```bash
pnpm add @devopsnext/starterkit-button-component@<version-from-step-1>
```

At the time this file was written step 1 answered `2.8.2`, so step 2 was:

```bash
pnpm add @devopsnext/starterkit-button-component@2.8.2
```

`package.json` must end up holding the bare number — `"@devopsnext/starterkit-button-component":
"2.8.2"`. **Open it and check.** If your client widened it to `"^2.8.2"`, re-add with
`--save-exact` (npm/pnpm) or `--exact` (yarn).

**Why not just `@latest`.** It installs the same code, but every client writes a **caret** range
instead of the number. A caret lets a later minor bump change how every button on the screen renders
with no review and no diff, and it fails any `pinned === installed` check. Same for `@^2`, `@~2.8`,
`@*` and a bare `pnpm add <pkg>` — all of them record a range. The point of step 1 is not to avoid
new versions; it is to take the newest one **deliberately**, on a line someone can review.

Upgrading later is the same two steps: re-run step 1, and if the number moved, re-run step 2 with it
and then work through [Staleness](#staleness--how-to-re-derive) before trusting the tables here.

Import the stylesheet **once**, at the app root — the root layout, `_app`, or your entry module:

```jsx
import "@devopsnext/starterkit-button-component/styles.css";
```

Never import it again from a component. Peer deps: `react` and `react-dom` >= 18. The package is
`type: module` and ships both `import` and `require` entries plus types.

```jsx
import { Button } from "@devopsnext/starterkit-button-component";
```

## See it rendered — the live Storybook

Public, no login. This is the only place the *rendered* result of an axis combination is visible; the
tables below tell you what is legal, the Storybook tells you what it looks like.

<https://thinktalentservice-ai.github.io/starterkit-button-component/?path=/docs/components-button--docs>

| Story id | Shows |
|---|---|
| `components-button--docs` | the whole design contract, rendered |
| `components-button--axis-matrix` | every tone × fill in one grid — **use this to pick** |
| `components-button--presets` | what each `variant` alias actually looks like |
| `components-button--sizes-and-shapes` | sm/md/lg × chip/pill |
| `components-button--states` | loading, disabled, focus, full-width |
| `components-button--contextual-translucent` | the translucent fill on a coloured surface |
| `components-button--brand-comparison` | two brands side by side |
| `components-button--cross-family-gradients` | gradient tones together |

Deep-link with `?path=/docs/components-button--<id>` (or `/story/…` for a non-docs story);
`…/iframe.html?id=<id>&viewMode=docs` renders one bare. `?globals=brand:elemetrik;scheme:dark`
reproduces any of the four brand/scheme states as a shareable link — the decorator writes those
attributes to `<html>`, not to the story wrapper. The machine-readable story list is `…/index.json`.

**Use the Storybook for appearance only.** Its ArgsTable is unreliable — see the gap noted under
[Staleness](#staleness--how-to-re-derive).

## The four axes

There is no variant lookup table. Every visual decision belongs to exactly one axis, so a new tone
costs one CSS rule and combines with every fill for free.

| Axis | Values | Default |
|---|---|---|
| `tone` | `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink` `neutral` | `primary` |
| `fill` | `solid` `ghost` `outline` `bare` `translucent` | `solid` |
| `shape` | `chip` `pill` | `chip` |
| `size` | `sm` `md` `lg` | `md` |

10 × 5 × 2 × 3 = 300 reachable combinations. A `tone` publishes `--ib-ch` (an `r g b` channel
triplet), `--ib-grad`, `--ib-on-solid` and `--ib-accent`; a `fill` reads them. Since 2.4.0 no fill
reads `--ib-on-solid` — it is still published, but it no longer reaches any label.

### What each axis renders as (2.8.2)

Read from `styles.css`; the Storybook shows it.

| Axis value | Rendering |
|---|---|
| `shape="chip"` | `border-radius: 6px` in **every** brand and scheme (2.7.0). Not the theme's `--radius-chip` (16px in dark, shared with chips and badges) — following that made a button change shape on a scheme toggle. Override with `--ib-btn-radius`. |
| `shape="pill"` | `var(--radius-pill)`, vendored default `9999px` |
| `size` sm / md / lg | padding `6px 14px` / `10px 20px` / `13px 28px`; font-size `12px` / `13px` / `15px`; min-height `28px` / `39px` / `46px`. md was 14px / 40px through 2.3.0 and dropped 1px in 2.6.0. |
| `fill="solid"` | tone gradient; label **white** (`#fff`) in every tone and brand (2.4.0); small tone-tinted drop shadow (`0 2px 6px` at 0.22, softened in 2.5.0); glow layer **off** by default (2.5.0); `brightness(1.1)` on hover |
| `fill="outline"` | transparent background; **1px** border at **40%** of the tone's channel (2.8.0 — through 2.7.0 it was a solid 2px); label is the tone's `--ib-accent`; hover washes the tone channel at 10%. `neutral` draws its border from the structural outline-border token and reads `--fg1`. |
| `fill="ghost"` | structural ghost background and outline-border tokens, `--fg2` label (`--fg1` on hover) — tone-independent |
| `fill="bare"` | no background or border; label is the tone's `--ib-accent`; hover washes the tone channel at 8% |
| `fill="translucent"` | white wash at 15% and a 2px white border at 22%; label `#fff` — see [the trap](#the-translucent-trap) |

### Presets (`variant`)

A named alias for a point in axis space — **never a second styling API**. `variant="pill"` and
`tone="primary" fill="outline" shape="pill"` produce byte-identical DOM.

| `variant` | equals |
|---|---|
| `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink` | `tone=<same>` `fill=solid` |
| `ghost` | `tone=neutral fill=ghost` |
| `text` | `tone=neutral fill=bare` |
| `pill` | `tone=primary fill=outline shape=pill` |
| `pill-filled` | `tone=neutral fill=translucent shape=pill` |

**Explicit axis prop beats the preset; the preset beats the default — resolved per axis,
independently.** An unknown `variant` degrades to the defaults and warns **dev-only, once per bad
value**. In production `variant="dnager"` renders a normal primary button, silently.

## Choosing

| Job | Write |
|---|---|
| The one primary action on a screen | `<Button>Save</Button>` — the defaults are already `primary`/`solid` |
| Secondary action beside it | `variant="ghost"`, or `tone="primary" fill="outline"` |
| Tertiary / inline action | `variant="text"` |
| Destructive | `tone="danger"` — `fill="solid"` to confirm, `fill="outline"` to offer |
| Positive confirmation | `tone="success"` |
| Toolbar / dense row | `size="sm"`, one fill across the row |
| CTA on a gradient hero or a filled card | `fill="translucent"` — see the trap below |
| Navigation that looks like a button | `href="…"` (renders an `<a>`) |

Three rules that keep a screen coherent:

- **One `solid` per view region.** Solid is the "this is *the* action" signal; two of them in one card
  is two primary actions, which is none.
- **Vary `fill`, hold `tone`, inside a group.** A row in five tones reads as five unrelated features.
- **`shape` is a family decision, not a per-button one.** Pick chip or pill for a surface, stay with it.

## Other props

| Prop | Notes |
|---|---|
| `loading` | Spinner, `aria-busy`, interaction blocked, keeps its own colour (busy, not dead). **Replaces `startIcon` and suppresses `endIcon`.** On the `<button>` branch it also sets the native `disabled`. |
| `disabled` | Dead state. Solid fills keep a wash of their own hue so identity survives. |
| `fullWidth` | `width: 100%` via `data-full-width`. |
| `startIcon` / `endIcon` | Both hidden while loading. |
| `href` | Renders `<a>`. The prop type is **discriminated**: with `href` you get `target`/`rel`/`download`; without it you get `type` (defaults to `"button"`). Mixing them is a compile error, not a silently ignored prop. |
| `className` | Merged onto `ib-btn`. |
| `ref` | Forwarded to the underlying node. Required by MUI Tooltip/Menu/Popper, focus management and scroll-into-view. |

Anything else is spread onto the underlying element.

**Worth an hour of debugging, and in no ArgsTable:** a `disabled` **or** `loading` **anchor** is
inert *by construction*. `<a>` ignores the `disabled` attribute, so the component drops `href` and
`onClick`, sets `role="link" aria-disabled="true" tabIndex={-1}`, and kills `pointer-events` in CSS.
Those props are spread **last**, so a caller-supplied `tabIndex` or `onClick` cannot resurrect it.
That is the intended behaviour, not a bug to work around.

## Rendered DOM contract

`class="ib-btn …"` plus `data-tone`, `data-fill`, `data-shape`, `data-size` **always**;
`data-loading` + `aria-busy` when loading; `data-full-width` when full width; and `data-interactive`
**only when neither disabled nor loading** — every hover and active rule is gated on it, which is why
it exists.

Never select on these from app CSS and never restyle `.ib-btn` — see the namespace rule below.

## Design-system rules this button inherits

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
whatever fallback exists wins, and a wrong colour ships.

**2. Your token source is primary; `styles.css` is the backup.** Every token the component reads is
aliased once on `.ib-btn` as `var(--your-token, <vendored default>)`. A CSS fallback applies only to
an *absent* custom property, so wherever you define the token it wins — no import order to get right,
no `@layer`, nothing to load first. `styles.css` declares **nothing on `:root`**, imports nothing and
makes no network request. Its rules are deliberately **unlayered** so they beat unlayered global
resets such as Bootstrap's `button {}` — but unlayered only wins where the selector is *more
specific*. Against an equal-specificity rule the cascade falls through to source order, so write
compound selectors (`.my-wrap.btn-group`, not `.my-wrap`) when a Bootstrap component class is also
present.

**3. Never hardcode ink over a brand fill.** `--{family}-on-solid` is a **measured** ink — `#0b0f19`
or `#ffffff`, whichever scores better against the *worse* of the family's resting and hovered fill —
and it is per brand. A literal `#fff` label is a rendered WCAG failure that no token audit can see,
because a literal inside a component is invisible to one. On the default brand, white on
`--accent-solid` measures ≈1.4:1. **The one exception is this Button:** since 2.4.0 its solid fill
is white in every tone and brand by *product decision, not contrast measurement* (the CSS says so),
and `--{family}-on-solid` no longer reaches its label. That is the package's choice to make — do not
"correct" it by writing `#fff` or a hex yourself, and do not expect `--{family}-on-solid` to change
a button label. To force a different ink on one button, set `--ib-on-grad`.

**4. Colour scheme goes on `<html>`, nowhere else.** `data-mui-color-scheme` is the ABI;
`[data-theme="light"]` on any ancestor is matched as a second selector; with neither present,
`prefers-color-scheme` decides.

**5. Do not restyle the `.ib-*` namespace.** It is package-owned. Restyle by overriding a **token**,
never by writing a rule against the package's class or its `data-*` attributes — those are a
selection contract between the component and its own stylesheet, and a rename upstream stops every
rule you wrote from matching, with no type error.

**6. Never drive hover, focus or press from JS.** The package removed exactly this and will not take
it back: `onMouseOver`/`onMouseOut` drops events during fast pointer movement or a re-render
mid-hover and leaves the button stuck in its hover look; `:active` has no reasonable JS equivalent;
`:focus-visible` is impossible in JS, because `onFocus` fires for mouse clicks too, so a JS focus
ring punishes mouse users while telling you nothing about keyboard navigation; and a lift or
transition written in JS cannot be turned off by `prefers-reduced-motion`. Moving to CSS was an
accessibility fix, not a refactor.

## Tokens this package owns

- `--ib-btn-focus-ring` — focus ring colour. Unset by default.
- `--ib-btn-radius` — corner radius for `shape="chip"`, every size. Defaults to `6px` in every brand
  and scheme (2.7.0).
- `--ib-btn-glow` / `--ib-btn-glow-hover` — alpha (0–1) of the tone-coloured glow around a solid
  button at rest / on hover; `--ib-btn-glow-hover` also drives the outline hover glow. **Both default
  to `0` (glow off) since 2.5.0.** The 2.4.0 look is `--ib-btn-glow: 0.4; --ib-btn-glow-hover: 0.5`.
- `--ib-on-grad` — label ink for `fill="solid"` and its spinner's highlighted edge. Defaults to
  `#fff` for every tone and brand (2.4.0); through 2.3.0 it fell back to the tone's measured
  `--{family}-on-solid`, and that fallback is gone. Set it only to force a different ink for one
  button.
- `--ib-on-translucent` — label ink for `fill="translucent"` and its spinner's highlighted edge.
  Defaults to `#fff`.
- `--ib-accent-{primary,secondary,accent,success,warning,danger,info,accent-green,accent-pink}` —
  label colour for the transparent fills (`outline`, `bare`), in **both** schemes. The vendored
  default (`--{family}-text`, defined as ≥ 4.5:1 on `--surface` per scheme) is already legible
  everywhere; this override exists for a brand that wants a *different* accent, not to fix contrast.

### The translucent trap

`fill="translucent"` is deliberately **tone-independent** — white-on-whatever, sized to sit **on top
of a coloured surface**. On a plain light page background it is white-on-white and disappears. That
is a property of the fill, not a bug. Use it on a gradient hero or a filled card, or repoint
`--ib-on-translucent`.

**Known limitation, unfixed upstream:** its background wash and border, and the spinner's
un-highlighted ring, read `--white-channel` at low alpha and **do not flip with colour scheme**.
Fixing it needs a scheme-flipping `--overlay-channel` the token sheet does not publish yet.

## Accessibility — already handled, do not undo

- `:focus-visible` ring at 2px offset. Solid fills ring in `--fg1`, because a same-hue ring on a
  same-hue gradient is invisible.
- `prefers-reduced-motion`: transitions and the press offset are removed, and the spinner is
  **slowed, not stopped** — it carries state rather than decoration.
- `forced-colors`: a system `ButtonText` border restores the affordance the OS strips along with the
  gradient. No `forced-color-adjust` override — the user's palette wins.
- `min-height` per size clears the WCAG 2.5.8 target minimum: **sm 28px, md 39px, lg 46px**
  (font-size 12/13/15).

## Copy-paste patterns

```jsx
// Primary action + secondary — one tone, two fills
<Button onClick={save} loading={isSaving}>Save changes</Button>
<Button fill="outline" onClick={cancel}>Cancel</Button>

// Destructive confirm
<Button tone="danger" onClick={remove} startIcon={<Trash2 size={16} />}>Delete</Button>

// Dense toolbar
<Button size="sm" fill="ghost" tone="neutral" startIcon={<Filter size={14} />}>Filter</Button>

// Link that looks like a button
<Button href="/reports/42" fill="outline" shape="pill">Open report</Button>

// On a gradient hero / filled card
<Button fill="translucent" shape="pill">Explore</Button>

// Full-width mobile CTA
<Button fullWidth size="lg">Continue</Button>
```

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| `className="btn btn-primary"` on a `<button>` | Bootstrap's palette, not the design system's | `<Button>` |
| `style={{ background: "#0099ff" }}` | Pins one brand's blue; breaks under the next brand | `tone="primary"` |
| `color: #fff` (or any hex) on a solid button | The package already renders solid labels white (2.4.0); a literal in app CSS is a second source of truth — see rule 3 | let `--ib-on-grad` default, or set `--ib-on-grad` to force another ink |
| `variant="pill"` when you wanted a *filled* pill | `pill` is an **outline** preset | `shape="pill"` + the fill you want |
| Two `fill="solid"` buttons side by side | Two primary actions | one solid + one `outline`/`ghost` |
| `disabled` + `href`, expecting navigation | The anchor is inert by construction | that is the intended behaviour |
| Restyling `.ib-btn` or selecting on `data-fill` in app CSS | Package namespace and selection contract | override a token |
| `onMouseOver` styling on a wrapper | Rule 6 | CSS, or nothing — the package already does it |

**The one that has no warning at all:** an unknown **`tone`**. Unlike `variant`, `resolveAxes` passes
a bad `tone` straight through to `data-tone`, it matches no CSS rule, and the button falls back to
foreground grey — a plausible-looking wrong answer. TypeScript catches it; a plain-JS caller gets
nothing. If you consume this from JS behind a wrapper, a `PropTypes.oneOf([...roles])` on that
wrapper is the only dev signal a typo will ever get. It does nothing in production — treat it as a
development guard, not a runtime guarantee.

## Staleness — how to re-derive

This file documents 2.8.2. Nothing enforces that; check it. Compare three numbers — what the registry
publishes, what `package.json` pins, and what is actually installed:

```bash
npm view @devopsnext/starterkit-button-component version
```

```bash
npm ls @devopsnext/starterkit-button-component
```

They should all match, and the `package.json` entry should be a bare number with no `^` or `~` —
see [Install](#install--always-the-latest-version-always-pinned-exactly).

The fingerprint in the table at the top is the first 12 hex of the sha256 of the installed
`dist/index.d.ts`. Reproduce it:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-button-component'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

**Do not "simplify" that to `require('@devopsnext/starterkit-button-component/package.json')`.** The
`exports` map declares only `.` and `./styles.css`, so any other subpath throws
`ERR_PACKAGE_PATH_NOT_EXPORTED`. Resolve the main entry and walk to its sibling.

`739f1028e93a` means the *type surface* is the one these tables describe. **It does not see CSS.**
Versions 2.4.0 → 2.8.2 repainted the button (white solid labels, shadow, 13px md, 6px chip radius,
1px outline) and the fingerprint never moved, so a matching fingerprint says nothing about
appearance or about the token defaults in `styles.css`. For those, the version number is the check.

If the installed version has moved past 2.8.2, re-derive **before** trusting a table, in this order:

1. `node_modules/@devopsnext/starterkit-button-component/dist/index.d.ts` — the authoritative axis
   unions, the `PRESETS` map and the discriminated `ButtonProps`.
2. `node_modules/@devopsnext/starterkit-button-component/README.md` — the design contract and the
   token list.
3. The [Storybook](#see-it-rendered--the-live-storybook) for the rendered result; its current story
   list is always `…/index.json`.
4. The source repo, <https://github.com/thinktalentservice-ai/starterkit-button-component> —
   `src/axes.ts`, `src/Button.tsx`, `styles.css`.

**Known documentation gap:** the published Storybook's ArgsTable prints `-` for the type *and* the
default of every union prop, advertises `size` as `string`, documents neither `className`, `type`,
`ref` nor the rest-spread, and states no package version. Treat `dist/index.d.ts` as the source of
truth for types, and this file for defaults.

## Red flags — stop

- About to run `pnpm add …@latest`, `@^2`, `@~2.8` or a bare `pnpm add <pkg>` → all of them record a
  **range**. Look up the latest version, then install that literal number.
- `package.json` shows `"^2.8.2"` rather than `"2.8.2"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry → check first; the
  latest may have moved past 2.8.2.
- About to write a literal `#fff` (or any hex) as a label colour on a brand fill → rule 3; the solid
  fill is already white, so it is redundant at best and a per-brand contrast bug at worst.
- About to add a CSS rule for `.ib-btn` or `[data-fill="…"]` in app styles → override a token.
- About to reach for `mint`, `sky`, `amber` or any other hue name → it resolves to nothing, silently.
- About to write `onMouseOver` hover styling → rule 6.
- About to use `fill="translucent"` on a plain page background → it will be invisible.
- About to import `styles.css` from a component → it belongs once, at the app root.
- Storybook ArgsTable says a prop's type is `-` → read `dist/index.d.ts` instead.
