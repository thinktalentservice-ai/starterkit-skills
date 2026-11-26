---
name: starterkit-badge
description: Use when adding, restyling, reviewing or migrating any status pill, label, tag, role or category chip in an app that uses @devopsnext/starterkit-badge-component — whenever a `variant=`, `tone=` or `fill=` string is being chosen, when installing or pinning the package, when replacing a local StatusBadge or an MUI Badge or Chip, and when diagnosing symptoms like a badge rendering grey, `color="error"` doing nothing, a badge with no styling, hard-to-read white text on a solid badge, a clickable badge the keyboard cannot reach, a huge icon inside a badge, a long label spilling out of its container, or no console warning for a mistyped value.
license: MIT
compatibility: React 18+ consumer, ESM or CJS. Install commands are shown for pnpm; npm and yarn work the same way. No build-time plugin or repo script is required.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-badge

`@devopsnext/starterkit-badge-component` is the Obsidian design-system Badge: a **label** pill for
status, role, tag or category. It renders one `<span>` with data attributes; `styles.css` does all
the styling. Zero runtime dependencies, React as a peer.

**Its API is not MUI's.** There is no `color` prop, no `badgeContent`, and `variant` is not the
fill.

## Documented against

| | |
|---|---|
| Package version | **0.2.0** — npm `latest` on 2026-11-27, published 2026-11-25 |
| Type-surface fingerprint | `696bd9dd93ac` — sha256 of `dist/index.d.ts`, first 12 hex ([command](#staleness)) |
| Token defaults | Vendored in `styles.css` from `@devopsnext/starterkit-theme` 1.5.0 (`presets/think.css`) |
| Source | <https://github.com/thinktalentservice-ai/starterkit-badge-component> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-badge-component> |

## See it rendered

<https://nextv3.thinktalent.info/starterkit-user/design/badge/> shows tones, the tone × fill matrix,
sizes, dots, icons, shapes and in-context layouts, with JSX. It is a starter-app page, not the
package's own docs: `RoleBadge` and `StatusBadge` there are **app components** and are not exported
by this package. Its §7 caption says `StatusBadge` maps to `--status-*` tokens; the rendered badges
are ordinary `tone` badges. The tables here come from the package source and win on any conflict.

## Is this the right component?

| Need | Use |
|---|---|
| Status, role, tag, category text | this `Badge` |
| Count or dot anchored on an icon (unread `5` on a bell) | MUI `<Badge badgeContent={5} color="error">` or your existing overlay. **Not this package.** |
| Clickable or toggleable tag | a real button: [`starterkit-button`](../starterkit-button/SKILL.md), or `<button type="button">` around the badge |
| Dismissible chip | MUI `Chip` or an app component |

If both libraries are in one file, alias one: `import { Badge as MuiBadge } from "@mui/material"`.

## Install — latest version, pinned exactly

```bash
npm view @devopsnext/starterkit-badge-component version
```

Then install the number it printed (`0.2.0` when this was written):

```bash
pnpm add @devopsnext/starterkit-badge-component@0.2.0
```

`package.json` must hold the bare number. Clients write a caret range by default, even when you name
a version with npm, so pass `--save-exact` (`npm install --save-exact`, `pnpm add --save-exact`;
`yarn add --exact`) and check the file afterwards.

Import the stylesheet **once** at the app root, after the theme preset if the app has one:

```jsx
import "@devopsnext/starterkit-theme/presets/think.css"; // optional; or the app's brand preset
import "@devopsnext/starterkit-badge-component/styles.css";
```

Without the second line the badge is plain unstyled text, with no error. The theme is optional:
`styles.css` carries Think defaults, and any token the host defines wins.

```jsx
import { Badge } from "@devopsnext/starterkit-badge-component";
```

**Check for a local wrapper first** (for example `@/components/badges`). A wrapper can have other
defaults and props (`pill`, a different default `variant`). Read it before assuming this API, and
check which `Badge` each file imports. Domain mappings such as `StatusBadge` and `RoleBadge` belong
in the app. "Replace `StatusBadge` with the package Badge" means replacing what it renders: keep its
status keys, labels and call sites, and map each key to `tone`.

## API

| Axis | Values | Default |
|---|---|---|
| `tone` | `primary` `secondary` `accent` `success` `warning` `danger` `info` `accent-green` `accent-pink` `neutral` | `neutral` |
| `fill` | `soft` `solid` `outline` `ghost` | `soft` |
| `shape` | `chip` `pill` | `chip` |
| `size` | `sm` `md` `lg` → 11 / 12 / 13px | `md` |

`variant` is only a preset: any tone name means that tone with `fill="soft"`; `variant="ghost"`
means `neutral` + `ghost`. `variant="solid"`, `"soft"` and `"outline"` **are not valid**. An
explicit axis prop beats the preset, per axis.

| Prop | Notes |
|---|---|
| `dot` | Leading status dot, `aria-hidden`. Tone colour; label colour on `solid`. |
| `icon` | Leading node, `aria-hidden`. **The CSS does not size it**: pass `<Check size={12} />`, or a default 24px icon blows up the pill. |
| `uppercase` | Default `false`; also resets a parent's `text-transform`. |
| `className`, `style`, `ref`, span attributes | `className` is merged, `ref` forwarded (works with MUI `Tooltip`). |

Also exported: `PRESETS`, `TONES`, `FILLS`, `SHAPES`, `SIZES`, `DEFAULT_AXES`, `resolveAxes`, and
the `Badge*` types.

`dot` and `icon` are hidden from assistive tech, so the **text must name the state**. "Failed", not
a red dot beside a job name. An icon-only badge announces nothing.

## Choosing

| Meaning | Write |
|---|---|
| Healthy, deployed, passed | `tone="success" dot` |
| Waiting, needs review | `tone="warning"` |
| Failed, blocked (MUI `error`) | `tone="danger"` |
| Draft, idle, closed | `tone="neutral"`, or `variant="ghost"` for quieter |
| Category or tag | default `soft`; add `shape="pill"` if the app's tags are pills |

`soft` is the normal choice. `outline` draws the tone on the border; `ghost` keeps a neutral border
and shows the tone only in the label. Never pick a role for its hue: use the one that matches the
meaning. When replacing a red MUI tag that does not mean failure (a "beta" label), ask whether the
red matters; if not, use `neutral` or a categorical tone.

## `fill="solid"` contrast — check before using

The package uses the theme's `--<role>-on-solid` as label ink. In theme **1.7.0** that is white for
every role (one figure below means dark and light match), and on many fills it is below the 4.5:1 that 11–13px text needs:

| Tone on `solid` | Think (dark / light) | Elemetrik (dark / light) |
|---|---|---|
| `secondary` | 10.0 / 14.4 ✅ | 11.9 / 17.0 ✅ |
| `accent-pink` | 4.9 ✅ | 4.9 ✅ |
| `primary` | 2.7 / 3.5 ❌ | 5.9 ✅ |
| `accent` | 1.7 ❌ | 4.9 ✅ |
| `info` | 2.7 / 3.5 ❌ | 2.7 / 3.5 ❌ |
| `danger` | 3.7 ❌ | 3.7 ❌ |
| `success` | 2.8 ❌ | 2.8 ❌ |
| `warning` | 2.2 ❌ | 2.2 ❌ |
| `accent-green` | 1.7 ❌ | 1.7 ❌ |

The package's accessibility test disables the contrast rule, so nothing catches this. For a ❌ cell,
use `soft` or `outline`. Their labels use the `-text` token: on the demo page (Think theme,
2026-11-27) every tone in `soft`, `outline` and `ghost` measured at least 4.6:1 in light and 5.4:1 in
dark, and the `solid` ratios matched the Think column above. Those figures are for that page's
background; Elemetrik's `soft` and `outline` were not measured. If the design requires solid, say the
ratio to the user, and fix it by overriding **both** `--<role>-solid` and, if needed,
`--<role>-on-solid` in the app's token sheet after measuring. Those tokens affect every component
that reads them. Do not write a literal `#fff` or a rule against `.ibd-*`.

## Failures that stay quiet

| Symptom | Cause | Fix |
|---|---|---|
| Badge is grey | unknown `tone` such as `error`, `green`, `mint`, or no `tone` at all | use a listed tone; MUI `error` is `danger` |
| `color="error"` does nothing | no `color` prop; it lands on the `<span>` as a stray attribute | `tone="danger"` |
| Typed a bad value, no console warning | the dev check needs a global `process`; a Vite browser build has none, and production never warns | verify values against the table, or read `data-tone` / `data-fill` in DevTools; in plain JS, validate in the wrapper (`PropTypes.oneOf` works only up to React 18; React 19 ignores it) |
| Click works with a mouse only | `onClick` is spread onto a `<span>`: no role, tab stop or key handling | wrap it in a button, see below |
| Long label overflows its column | `white-space: nowrap` with no ellipsis | shorten the label, or truncate a child: `<Badge title={s}><span style={{maxWidth:"20ch",overflow:"hidden",textOverflow:"ellipsis"}}>{s}</span></Badge>` |
| `TONES.map` fails in a Next.js Server Component | the whole built module is `"use client"`, so its constants are client references there | iterate them in a client file; `<Badge>` itself renders fine from a server component |

Restyle by overriding a theme **token**. The `.ibd-*` classes and `data-*` attributes belong to the
package.

## Patterns

```jsx
<Badge tone="success" dot>Deployed</Badge>
<Badge tone="warning" fill="outline">Pending review</Badge>
<Badge tone="danger">Failed</Badge>
<Badge tone="primary" size="sm" shape="pill" uppercase>New</Badge>

// Clickable tag: the button owns interaction and state
<button type="button" aria-pressed={on} onClick={toggle}
  style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}>
  <Badge tone="danger" fill={on ? "outline" : "soft"} icon={on ? <Check size={12} /> : null}>
    beta
  </Badge>
</button>

// Domain mapping stays in the app
const STATUS = {
  deployed: { tone: "success", label: "Deployed" },
  review:   { tone: "warning", label: "Pending review" },
  failed:   { tone: "danger",  label: "Failed" },
};
```

Keep the browser's focus outline on the wrapping button.

## Staleness

Compare the registry (`npm view … version`), `package.json` and `npm ls` for this package. Then
fingerprint the installed types. The `exports` map exposes only `.` and `./styles.css`, so resolve
the main entry rather than `package.json`:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-badge-component'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

If it is not `696bd9dd93ac`, re-derive the axes and props from `dist/index.d.ts` before trusting
this file. An unchanged fingerprint does not cover CSS or theme changes: re-read `styles.css`, and
re-measure the contrast table if the theme version moved.
