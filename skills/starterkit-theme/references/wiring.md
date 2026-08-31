# Wiring `@devopsnext/starterkit-theme`

Companion to [SKILL.md](../SKILL.md). Read that first for the token decision table; this file covers
getting the tokens onto the page and into MUI. Derived from the published 1.4.1 tarball
(`dist/*.d.ts`, `dist/mui.js`, `presets/*.css`) and from the reference host,
`template-starterkit-nextjs`.

## The three supported routes

| Route | You get | Cost |
|---|---|---|
| **Static preset sheet** — `import ".../presets/<id>.css"` | one brand, compiled, zero runtime | cannot switch brand per tenant |
| **SSR-injected brand** — `serializeBrandCss(resolveBrand(preset))` into a `<style>` in `<head>` | per-request or per-tenant brand, applied pre-paint | you own the `<style>` element |
| **`BrandProvider`** — the package's own client component | the same CSS, injected client-side, plus `useBrand()` | see the caveats below |

**No `adoptedStyleSheets` anywhere in the package.** If you need a brand to sort *after* every
document stylesheet — a live preview, say — that is your own code to write.

## Import order

All of these belong in **one** module — the root layout, `_app`, or your entry file. Turbopack and
webpack preserve CSS order *within* a module, not across modules; moving one import into a component
forfeits the ordering you thought you had.

```jsx
import "@devopsnext/starterkit-theme/presets/think.css";      // 1. THE TOKEN SOURCE
import "@devopsnext/starterkit-button-component/styles.css";  // 2. component packages
import "@devopsnext/starterkit-card-component/styles.css";
import "@devopsnext/starterkit-layout/styles.css";
import "@devopsnext/starterkit-theme/styles.css";             // 3. structural CSS that reads tokens
import "@/styles/your-overrides.css";                         // 4. your app, last
```

Three things this order buys:

1. **The preset sheet is first and is the entire token source.** Every colour, radius, shadow and
   channel comes from it. Your own stylesheet holds only overrides — if it holds a *copy* of the
   token block, the copy is the loser and nobody will notice for months.
2. **`styles.css` after the component packages**, so its `--ic-card-focus-ring` correction lands on
   top of the card package's own rule.
3. **Your app last**, so "the app's overrides come last" is true rather than accidental.

If the preset id is referenced anywhere else — a brand document validator's default, a contrast gate,
a CDN emitter — assert that it equals `DEFAULT_PRESET_ID` rather than repeating the literal. A gate
reading a preset the app does not import will happily measure the wrong brand and pass.

## SSR-injected brand

```js
// server
import { resolveBrand, serializeBrandCss } from "@devopsnext/starterkit-theme";
import { PRESETS } from "@devopsnext/starterkit-theme/presets";

const preset = PRESETS[id];                     // possibly undefined — handle it
if (!preset) throw new Error(`unknown preset: ${id}`);

const brand = resolveBrand(preset);             // collects `warnings`, throws only on structure
const css = serializeBrandCss(brand, {
  provenance: { version: pkgVersion, brand: id },
  // lightSelectors defaults to ['[data-mui-color-scheme="light"]']
});
```

Render it as exactly one `<style>` in `<head>`:

```jsx
<style id="brand-vars" dangerouslySetInnerHTML={{ __html: css }} />
```

- `"brand-vars"` is `BRAND_STYLE_ELEMENT_ID`. Import it from `.../react` in a client module; in a
  **server** component use the literal — that module starts with `"use client"`, and importing a
  constant out of it from a server component risks yielding an unresolved client reference instead of
  the string.
- **Exactly one element with that id.** A second one carrying the same tokens leaves which-one-wins to
  document order, and the live editor searches for that id to *replace* rather than append.
- `provenance` is what emits `--tokens-version` and `--tokens-brand`. A preset sheet alone does not
  carry them, so `getComputedStyle` will report empty strings for both unless you pass it.

If you inject the brand from an inline `<head>` script (pre-paint, to avoid a flash of the fallback
tokens), keep it a **classic** script. `type="module"`, `defer` and `async` all defer it, which
reintroduces exactly the flash it exists to prevent.

## MUI

```js
import { createStarterkitTheme } from "@devopsnext/starterkit-theme/mui";

const theme = createStarterkitTheme({ defaultColorScheme: "dark" });
```

`cssVariables` mode, `colorSchemeSelector: "data-mui-color-scheme"`, and **the same palette object in
both schemes** — every value is a `var()`, so the CSS layer does the flipping. `defaultColorScheme`
must be a concrete scheme (`"light" | "dark"`), never `"system"`; `"system"` is a runtime `mode`
concept resolved client-side by `useConcreteTheme()`.

**The hard constraint:** MUI's `augmentColor()` cannot parse `var(--primary)` and **throws at
theme-creation time** — which is build time. So every intention supplies all of
`REQUIRED_INTENTION_KEYS` explicitly: `main`, `light`, `dark`, `contrastText` and their four
`*Channel` counterparts. Nine intentions:

`primary` `secondary` `error` `warning` `info` `success` `accent` `accentGreen` `accentPink`

| MUI key | Token |
|---|---|
| `.main` | `--{f}` |
| `.light` | `--{f}-solid` |
| `.dark` | `--{f}-solid-hover` |
| `.contrastText` | `--{f}-on-solid` |
| `background.default` / `.paper` | `--background` / `--surface` |
| `text.primary` / `.secondary` / `.disabled` | `--fg1` / `--fg2` / `--fg-disabled` |
| `divider` | `--border`, with `dividerChannel: undefined` **explicitly** |

**`error` maps to the `danger` family.** There is no `--error-*` token.

`dividerChannel` being explicitly `undefined` rather than absent is load-bearing: absent means "derive
it", `undefined` means "there isn't one". `--border` is already an `rgba()`, so there is no meaningful
triple to publish.

`accent` / `accentGreen` / `accentPink` are **not** MUI intentions MUI knows about. Module
augmentation declares them so `augmentColor()` does not throw on them; `<Button color="accent">`
carries no special meaning to MUI beyond what the palette entry provides.

**Known approximation:** `lightChannel` / `darkChannel` / `contrastTextChannel` all carry the
**mark's** triple, not the triple of the value each key actually holds. Only `mainChannel` is exact.

### Typography is not var()-driven

`dist/mui.js` hardcodes the literal string `"'Plus Jakarta Sans', system-ui, sans-serif"` across
`fontFamily`, `h1`–`h6`, `caption`, `button` and `overline`, and `CreateStarterkitThemeOptions`
exposes no font hook. The palette follows the brand automatically; the fonts do not — a
`makePreset({ fonts })` brand moves `--font-heading` / `--font-body` and MUI keeps the literal.

**Outfit is no longer used.** Both shipped presets set `--font-heading` and `--font-body` to Plus
Jakarta Sans, and the MUI typography agrees. The only surviving mention in the package is
`buildFontsSheet()`, which still fetches Outfit for consumers who choose it themselves. An app loading
Outfit via `next/font` and expecting headings to pick it up will not get it.

With `next/font` this matters in a specific way. On Next 16, `next/font` registers faces under the
**real** family name, so the package's literals do resolve — nothing is broken. What they miss is the
metric-matched fallback face `next/font` also emits (`ascent-override` / `descent-override` /
`size-adjust` measured against the real font). During the swap window MUI text alone reflows while
every `var(--font-*)` surface holds still. Route MUI through the tokens to fix it:

```js
import { createTheme } from "@mui/material/styles";

const base = createStarterkitTheme({ defaultColorScheme: "dark" });
const theme = createTheme(base, {
  typography: {
    fontFamily: "var(--font-body)",
    h1: { fontFamily: "var(--font-heading)" },
    // …h2–h6, button, caption, overline
  },
});
```

Override the **family only**. Weight, size, letter-spacing and line-height are the package's — this is
a wiring fix, not a restyle.

## React bindings

All client-only. `import { … } from "@devopsnext/starterkit-theme/react"`.

```jsx
"use client";
<BrandProvider id={id} css={css} theme={theme}>
  {children}
</BrandProvider>
```

| Export | Notes |
|---|---|
| `BrandProvider` | Renders **exactly one** `<style id="brand-vars">` and wraps its own `<ThemeProvider>`. The `id` prop is purely informational — nothing validates it against the CSS supplied |
| `useBrand()` | `{ id?, css }`. **Throws outside a provider** — reading brand state with no brand mounted is a bug at the call site |
| `useConcreteTheme()` | Resolves MUI's `mode` (which can be `"system"`) to `"light" \| "dark"`. Before MUI resolves a stored preference it falls back to `theme.defaultColorScheme`, not a hardcoded `"dark"` |
| `useTokenValue(name)` | Live `getComputedStyle` read of a `:root` custom property |
| `ThemeToggle` | Cycles light → dark → system; renders `disabled` until mounted |
| `BRAND_STYLE_ELEMENT_ID` | `"brand-vars"` |

**`useTokenValue` returns `""` during SSR and on the first client render.** There is no cascade to
read on the server, and inventing a value would make the first paint disagree with the second.
**Render a skeleton for `""` — do not treat it as a colour.** It re-reads on a `MutationObserver` over
`documentElement`'s `data-mui-color-scheme` / `data-theme` / `style`, and on `prefers-color-scheme`
change.

### When not to use `BrandProvider`

Two reasons a host may want its own context instead, both real:

1. **It renders its own `<style id="brand-vars">` inside `<body>`.** If you already inject the brand
   server-side into `<head>`, that SSR element must be the only one — two elements sharing the id make
   which-one-wins a document-order accident.
2. **It wraps its own `<ThemeProvider>` with no `defaultMode`**, which drops a `defaultMode` you had
   configured on your own `ThemeProvider`.

The reference host (`template-starterkit-nextjs`) declares a small `BrandIdContext` of its own for
exactly these two reasons. `useConcreteTheme` and `useTokenValue` are still fine to use — they read
the cascade and MUI, not `BrandProvider`.

## Bootstrap bridge

Load it **after** Bootstrap's own CSS, and only if the app renders Bootstrap components:

```jsx
import "bootstrap/dist/css/bootstrap.css";
import "@devopsnext/starterkit-theme/presets/think.css";
import "@devopsnext/starterkit-theme/bootstrap-bridge.css";
```

Two sections, because there are two problems. Section 1 repoints Bootstrap's **global** `--bs-*`
custom properties at the tokens. Section 2 closes the gap Section 1 cannot: Bootstrap 5.3 compiles
component classes with their own **scoped** properties (`.btn` reads `var(--bs-btn-bg)`, not
`var(--bs-primary)`), literal hexes baked in at Sass-compile time — so overriding the global does
nothing for a rendered button.

**Documented gaps — do not assume these are themed:** global `--bs-*-rgb` (comma-triple clash);
`.btn-light` / `.btn-dark` / `.text-bg-light` / `.text-bg-dark` (measure ≈1:1 in the light scheme,
deliberately left alone); `--bs-btn-focus-shadow-rgb`; `.text-bg-*`'s `color`; `.btn-outline-*`;
`.btn-check` states; `.table-{role}`; `.alert-{role}`; `.list-group-item-{role}`; and the `.accordion`
active state. The last three read a third baked system — `--bs-{role}-text-emphasis` / `-bg-subtle` /
`-border-subtle`.

**This file was silently broken once.** It still named deleted hue families, and `var()` on a
nonexistent custom property resolves to nothing with no error, so Bootstrap fell back to stock
literals. That is the failure mode to watch whenever a token name changes — re-check it as step 7 of
the staleness routine in SKILL.md.

## Custom brands

`makePreset(cfg)` where `cfg` is:

```ts
{
  id: string;
  name: string;
  seeds: Record<RoleName, string>;   // ALL NINE roles, required, 6-digit hex
  intensity?: number;                // 0..1, default 1 — scales COLOURED glow/shadow alphas only
  radius?: number;                   // default 12; chip/card/pill radii step off it
  fonts?: { heading: string; body: string; mono: string };
}
```

Nothing else is configurable. Ramp shape, duties, neutrals and the light-shift table live in
`src/presets/base.ts` and apply to **every** brand — changing one there changes both shipped presets
too.

A tenant **brand document** (`schema.json`) is a different, narrower shape: `{ id, preset, seeds?:
{ primary, secondary, intensity, radius }, overrides? }`. It has **four** seed fields, not nine, and
nothing in this package maps a brand document onto a `PresetConfig`. Write that mapping explicitly;
do not pass one where the other is expected.

`overrides` keys are validated **structurally only** (`^--[a-z0-9-]+$`). A well-formed but unknown
token name passes the schema and is then silently ignored by CSS. Run keys through `isTokenName()`
yourself before trusting a document.
