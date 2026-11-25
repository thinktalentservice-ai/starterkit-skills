---
name: starterkit-layout
description: Use when building, wiring, restyling, reviewing or migrating the dashboard shell of an app that uses @devopsnext/starterkit-layout — the topbar/header, vertical sidebar, navigation list, header dropdowns, profile menu, page footer, mobile drawer, mini-sidebar collapse, brand marks or auth-page logo; when installing or pinning the package; when a nav row must run a script instead of navigating; and when diagnosing symptoms like the shell rendering as a broken vertical stack, the mobile drawer visible below `lg`, a tenant logo painted 32×32 inside a gradient box, the content column reading grey in light mode, a nav row that never highlights, a CLICK row that silently does nothing, `Invalid hook call` after a `link:` install, or a profile photo that 401s and always falls back to initials.
license: MIT
compatibility: React 18+ consumer, ESM or CJS, Node 18+. Peers — react, react-dom, reactstrap >= 9.2, motion >= 12, simplebar-react >= 3.3. NO framework peer since 1.4.0. The host must already load Bootstrap 5.3 utility CSS. Install commands shown for pnpm; npm and yarn work the same way.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-layout

`@devopsnext/starterkit-layout` is the Obsidian dashboard shell — `FullLayout`, the `Header` chrome,
the vertical `Sidebar`, the brand marks, `ProfileMenu` and `Footer`. It exists so a fork of the starter kit
stops copy-pasting `layouts/` and re-deriving the same bugs.

**Controlled, stateless, slot-based. The package holds the mechanics; you keep the data, the store
and the content.**

> There is no store, no context and no data fetching, and there never will be. Every prop is a value
> or a callback. Almost every mistake below is someone expecting the shell to know something — the
> route, the user, the tenant's logo, whether a row is authorized — that it deliberately does not.

## Documented against

| | |
|---|---|
| Package version | **1.6.0** — npm `latest` on 2026-11-25, published 2026-11-25T13:41:54Z. 1.6.0 truncates long nav labels with an overflow tooltip and narrows the sidebar to 204px. 1.5.2 (2026-11-19T10:17:52Z) shipped the sidebar row fix — **1.5.1 was never published to npm**; 1.5.0 (2026-11-05T05:30:56Z) added `Footer` |
| `dist/index.d.ts` | `a9c15e5b3b02` — sha256, first 12 hex ([command](#staleness--how-to-re-derive)). The only change from 1.5.2 (`febbbed54173`) is the `ShellGeometry.sidebarWidth` doc comment (`Default 240.` → `Default 204.`); no export was added or removed |
| `dist/brand.d.ts` | `9b9aa264267d` (unchanged since 1.4.1) |
| `styles.css` | `c34b40d0503d` — 62 `il-*` classes, 18 `--il-*` geometry properties, 29 `--il-t-*` token aliases |
| Source | <https://github.com/thinktalentservice-ai/starterkit-layout> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-layout> |
| Reference wiring | `template-starterkit-nextjs` → `src/app/(DashboardLayout)/DashboardShell.jsx` |

**The reference wiring is the only app known to be on the current version.** Other repos in the
estate carry older copies of this shell and older copies of this skill; read them as history, not as
the contract. If a call site there disagrees with a table here, the table is right and the call site
is behind.

**How much to trust each section:** the prop, slot, hook, geometry and class tables are derived from
`dist/index.d.ts`, `dist/brand.d.ts`, `src/types.ts` and `styles.css` — authoritative. *Choosing*,
*Anti-patterns* and *Red flags* are judgement. **Storybook exists in the repo but is not a reference
you can open from a URL** — since 1.5.1 the repo commits a `.storybook/` config, `src/**/*.stories.tsx`
and a built static site in `docs/`, none of it shipped in the npm package, and the repo's GitHub Pages
URL answered 404 when checked (2026-11-20). Run `pnpm storybook` in a checkout, or read the reference
wiring instead.

## Install — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that literal version
number*. Do not install a range, and do not assume the version this file documents is still latest.

**Step 1 — ask the registry what latest is:**

```bash
npm view @devopsnext/starterkit-layout version
```

Or read it off the package page — the version is at the top right:
<https://www.npmjs.com/package/@devopsnext/starterkit-layout>
(`npm view @devopsnext/starterkit-layout versions --json` lists every published version.)

**Step 2 — install that exact number**, substituting whatever step 1 returned:

```bash
pnpm add @devopsnext/starterkit-layout@<version-from-step-1>
```

At the time this file was written step 1 answered `1.6.0`, so step 2 was:

```bash
pnpm add @devopsnext/starterkit-layout@1.6.0
```

`package.json` must end up holding the bare number — `"@devopsnext/starterkit-layout": "1.6.0"`.
**Open it and check.** If your client widened it to `"^1.6.0"`, re-add with `--save-exact`
(npm/pnpm) or `--exact` (yarn).

**Why not `@latest`.** It installs the same code, but every client writes a **caret** range instead
of the number. A caret lets a later minor bump move the whole app's chrome — every page, not one
component — with no review and no diff, and it fails any `pinned === installed` check. Same for
`@^1`, `@~1.6`, `@*` and a bare `pnpm add <pkg>`. The point of step 1 is not to avoid new versions;
it is to take the newest one **deliberately**, on a line someone can review. Upgrading is the same
two steps, then [Staleness](#staleness--how-to-re-derive) before trusting the tables here.

### Never consume this package via `link:`

It vendors its own react/react-dom so it can build and test itself, and a linked package resolves
from its own directory first. Identical version numbers do not save you — React identity is per
module instance, and you get `Invalid hook call`. Two copies of `motion` means two `AnimatePresence`
contexts and exit animations that never fire; two of `reactstrap` breaks the Bootstrap CSS contract
its dropdowns rely on. Use a packed tarball (`pnpm build && pnpm pack`, then `pnpm add` the `.tgz`) —
it behaves exactly like a registry install **and** tests what actually ships (`dist/` +
`styles.css`).

### Two silent prerequisites

Both are real, and the first is the package's only failure mode that **errors nowhere**.

1. **Bootstrap 5.3 utility CSS must already be loaded by the host.** The package emits `d-flex`,
   `d-lg-none`, `me-auto`, `gap-2`, `p-4` and deliberately does not depend on Bootstrap — declaring
   it would warn on every consumer that already has it transitively via reactstrap. Without a
   utility layer the shell renders as a **broken vertical stack and nothing throws**. If the shell
   looks unstyled, check this before anything else.
2. **`simplebar-react` needs its own stylesheet** — `simplebar-react/dist/simplebar.min.css`. The
   package cannot `@import` it; see the token contract.

**Fonts are not requested.** The type tokens carry family names only and fall back to `system-ui`.
Load Outfit and Plus Jakarta Sans yourself (`next/font` is self-hosted and CSP-safe).

### Peer dependencies

`react`, `react-dom`, `reactstrap`, `motion`, `simplebar-react`. `dependencies` is empty.

**There is no framework peer as of 1.4.0.** Nav rows render as plain `<a href>`, so the sidebar can
point at absolute URLs in sibling apps — which no router could client-navigate anyway. A row is a
document load. Nothing here imports `next`.

### Entry points

| Import | Contains | Runtime imports |
|---|---|---|
| `@devopsnext/starterkit-layout` | shell, sidebar, header, hooks, all four brand marks, `ProfileMenu`, `Footer` | the peers above |
| `@devopsnext/starterkit-layout/brand` | `BrandMark`, `Logo`, `AuthLogo`, `DEFAULT_BRAND_NAME` | **`react/jsx-runtime` only** |
| `@devopsnext/starterkit-layout/styles.css` | the entire visual definition | — |

`./brand` exists so a login page — which renders outside the shell — can show the brand without
pulling reactstrap, simplebar and motion into that route's bundle. **`Favicon` is deliberately not
there**: it needs `motion` for its collapse animation. `Footer` is not there either — it is main-entry
only (`./brand` is the brand marks and nothing else).

Import the stylesheet **once**, at the app root:

```jsx
import "@devopsnext/starterkit-layout/styles.css";
```

Both entries ship ESM and CJS with types, and `"use client"` is re-attached to every emitted chunk —
esbuild strips top-of-file directives, and a chunk that loses it fails at import time under the RSC
compiler.

## Wiring `FullLayout`

`FullLayout` is `"use client"` and fully controlled — you own every piece of state.

```jsx
"use client";
import { useState } from "react";
import { FullLayout } from "@devopsnext/starterkit-layout";

const [mini, setMini] = useState(false);
const [drawerOpen, setDrawer] = useState(false);

<FullLayout
  navItems={navItems}
  miniSidebar={mini}
  mobileSidebarOpen={drawerOpen}
  onToggleMini={() => setMini((v) => !v)}
  onToggleMobile={() => setDrawer((v) => !v)}
  onCloseMobile={() => setDrawer(false)}
  sidebarUser={{ initials: "AB", name: "Ada Byron" }}
  roleBadge="Reviewer"
  profile={{ initials: "AB", menu: <YourProfileMenu /> }}
>
  {children}
</FullLayout>
```

Full App Router recipe — stylesheet import order, the store-backed and store-free variants, RTL,
basePath logout, the brand-only auth page, a hand-assembled shell:
[references/wiring.md](references/wiring.md).

| Prop | |
|---|---|
| `navItems` | **required.** `NavItem[]`. The package has no data source of its own |
| `miniSidebar` `mobileSidebarOpen` `isRTL` `isTopbarFixed` `isSidebarFixed` | controlled booleans, all default `false` |
| `onToggleMini` `onToggleMobile` | callbacks |
| `onCloseMobile` | **must be idempotent.** It fires for overlay click, Escape, route change and crossing up into desktop — including on already-closed transitions. A toggling handler reopens the drawer |
| `pathname` | optional, and **not** used for active-link matching (1.4.0 moved that to `window.location`). Its only job is dismissing the drawer on client navigation — omit it if you never navigate client-side |
| `t` | `(key) => string`, applied to nav titles and captions. Defaults to identity, so i18n is opt-in |
| `geometry` | `{ sidebarWidth, miniSidebarWidth, topbarHeight }`. Numbers are px; they land as inline custom properties on the shell root |
| `autoHideHeader` | default `true`. The topbar slides out of flow on scroll down, returns on scroll up, and the sidebar's offset follows it |
| `container` `containerClassName` | children are wrapped in a reactstrap fluid `Container` — defaults `true` and `"p-4"`. `container={false}` renders them raw |
| `mobileSidebarId` | the drawer's `id` and the hamburger's `aria-controls`. Default `"il-mobile-sidebar"` |
| `className` `contentClassName` | extra classes on the shell root and on the content column |
| `footer` | `ReactNode`, no default — pass a `<Footer />`. See [`Footer`](#footer) |

## Slots — where each one lands

Chrome is slots. There is **no default profile menu, no default logout link and no search field** — a
shell package has no data to search and no business deciding where logout goes.

- **Left:** `favicon` (the desktop lockup, defaulting to `<Favicon miniSidebar={miniSidebar} />`),
  then the mini toggle, then `logo` (the sub-`lg` mark, defaulting to `<Logo />`), then the hamburger.
- **Centre:** `headerDropdowns[]`, then `headerCenterSlot`.
- **Right, in order:** `themeToggle`, `headerActionsSlot`, `roleBadge` (a string renders inside the
  pill; a node replaces it), `profile`, `headerEndSlot`.
- **Sidebar:** `sidebarHeader` replaces the default user block entirely (`null` removes it),
  `sidebarUser` — `{ initials?, name?, avatar? }` — fills it, and `sidebarFooter` renders after the
  nav, inside the scroller.
- **Content column:** `footer` renders after `children` — *outside* the fluid `Container`, so it is
  not inset by `containerClassName` — at the bottom of `.il-content-area`.

### `HeaderDropdownSlot`

The package owns the toggle and the panel chrome; the content is entirely yours.

| Field | |
|---|---|
| `id` | **required.** Stable key, and the base for the panel's generated aria ids |
| `icon` `label` | toggle glyph, and its accessible name — also the text of the panel's header row |
| `content` | panel body, rendered inside the scroller |
| `width` | `"panel"` (the 300px panel, default) or `"mega"` (full-bleed) |
| `scrollMaxHeight` | scroller cap in px, default 350. `false` drops the SimpleBar wrapper entirely |
| `showHeader` | render the `label` row above the content. Defaults true for `panel`, false for `mega` |
| `align` | `"start"` (default) or `"end"` |

A `mega` panel already scrolls itself at 480px. Leaving the default 350px scroller on nests a second
scroll region inside the first — pass `scrollMaxHeight: false`.

### `ProfileSlot`

`{ initials?, avatar?, label?, menu? }`. `avatar` replaces the gradient circle outright, `label`
defaults to `"Profile"`, and **nothing renders when `menu` is absent.**

## `navItems`

A `NavItem` is exactly one of three kinds, discriminated by which field is present:

| Present | Kind |
|---|---|
| `caption` | section heading. Every other field is ignored |
| `children` | collapsible group — **one level only**, sub-children are not rendered |
| neither | leaf, which `type` splits into a link or an action |

```ts
{ navigationId?, title?, href?, icon?, caption?, children?, defaultOpen?, suffix?, suffixColor?,
  type?, event? }
```

`icon` is usually a **class-name string** (`"bi bi-house"`, `"mdi mdi-home"`) rendered as
`<i className={icon} />` — that is what a navigation API returns. A ReactNode also works.
`defaultOpen` forces a group open regardless of route; it is an override, not the mechanism — a group
already opens itself when one of its children matches the current URL.

It is one interface of optional fields, **not** a discriminated union, deliberately: a union would
stop `NavItem` being an `interface`, so your own `interface Row extends NavItem` would break on a
minor version. The kinds are enforced where they are decided, in `Sidebar`'s dispatch.

**Active-row matching reads `window.location`, not a prop.** An `href` already carrying a scheme is
used as-is; anything else resolves against `window.location.origin`. Query and hash are dropped,
trailing slashes are normalised, root is held to an exact match, and the row whose path is the
longest prefix of the current one gets `.il-active-link` — a group containing it opens itself.
Nothing matches during SSR and hydration's first pass, so the highlight arrives one commit later by
design rather than mismatching the server HTML.

**Row rhythm is fixed (1.5.1, shipped in 1.5.2).** A nav row is `--il-row-height` (40px) tall and a
child row inside a group `--il-sub-row-height` (36px), with zero vertical padding, and the gap between
rows is one 8px `margin-bottom` on `.il-sidebar-area .nav-link` — so expanded and collapsed rows are
the same height and the column does not change rhythm when the sidebar toggles. Before 1.5.1 a row was
padding plus its tallest child (10px padding, 2px gap; leaf rows also carried an `mb-2` utility, so
leaves sat 8px apart and everything else 2px). Rows no longer carry `mb-2`, and the `.il-sidebar-nav`
wrapper no longer carries `pt-1 mt-2`; app CSS that targeted those, or re-tuned the old padding or
margin on `.nav-link`, needs revisiting. In the collapsed rail (`lg` and up), hover no longer scales or
slides the icon and label (`transform: none !important` on `.il-is-mini` rows), revealed labels fade in
over 0.2s (off under `prefers-reduced-motion`), and section captions are hidden with `visibility` so
they keep their height.

**Long labels truncate, with a tooltip only when cut (1.6.0).** Every row title — leaf, group parent
and group child — renders through an internal `NavLabel` (not exported) as `<span class="il-nav-label">`
with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`. On hover or keyboard focus of the
row, and **only if the text is actually clipped** (`scrollWidth > clientWidth`), the full title appears
in `.il-nav-tip`: portaled into the nearest `.il-shell`/`.il-brand` (so it keeps the token aliases),
`position: fixed` beside the row (mirrored under RTL), `z-index: 1080`, wrapping rather than truncating
again, capped at `min(320px, 100vw − sidebar − 24px)`. It is hoverable (a 120ms hide delay lets the
pointer cross onto it), dismissed by Escape, re-placed on scroll and resize, and hidden when the row
scrolls out of the sidebar's viewport — the WCAG 1.4.13 trio. The tip is `aria-hidden`; the full text
is already in the link's accessible name. A group's badge and chevron sit in `.il-nav-trail` and never
shrink — the label gives way first. For the ellipsis to work, the nav list is `flex-wrap: nowrap`
(Bootstrap's `.nav` wraps, which sized every row to the longest label) and each flex wrapper between the
row and the text is released with `min-width: 0`. **Do not reintroduce a `min-width: auto` or a
`flex-wrap: wrap` on those wrappers from app CSS** — one long label then widens every row and the
ellipsis never fires. Also in 1.6.0: the open sidebar is **204px** (was 240px), nav row text is
**12px** (`0.75rem`, was 13px), the content column's base size is 12px (was 13px), and the brand name,
mark glyph, tagline, role badge, dropdown header and nav captions are weight **600** (was 700).

### `toNavItems` — raw API rows → `NavItem[]`

```jsx
import { toNavItems } from "@devopsnext/starterkit-layout";
const navItems = useMemo(() => toNavItems(rows), [rows]);
```

A pure function over rows you already hold — it fetches nothing. It takes `{ navigationId,
navigationName, navigationPath, navigationOrder, navigationIcon, navigationGroup, navigationType,
navigationEvent }`, sorts numerically by `navigationOrder` (no order sorts last, in input order),
builds one collapsible group per distinct `navigationGroup` positioned at its **lowest** child order,
and leaves ungrouped rows as leaves.

- `navigationType` is matched case-insensitively and only an exact `"CLICK"` produces an action row,
  so a null or lowercase value navigates rather than evaluates.
- A CLICK row's `navigationPath` is **dropped**, not kept: it is `'#'` in the reference data, which
  resolves to the site root and would light the row on `/`.
- It does **not** filter by status or role. Dropping a row is an authorization decision, and a shell
  package that silently hides one hides a bug in your ACL. **Filter first.**
- `toNavItems(rows, { t })` translates `navigationName` and the group key. **Pass `t` here or to
  `FullLayout`, never both** — both translate, so both means `t(t(key))`, invisible right up until
  one of them returns something other than the key.
- Group parents get **no icon** unless you pass `{ groupIcon }`. There is no glyph that is right for
  a bucket whose name the package has never seen; the empty icon slot still reserves the column, so
  an iconless parent stays aligned.

### CLICK rows need `script-src 'unsafe-eval'` — and are an injection surface

A `CLICK` row's `event` is a **string of JavaScript**, compiled with `new Function(event)` and called
with no arguments. That is a Content-Security-Policy decision, so state it up front rather than
discover it:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

Without `'unsafe-eval'` the `Function` constructor throws `EvalError` on every CLICK row. The package
catches it and `console.error`s, so **the row silently does nothing** rather than breaking the page.
If your CSP cannot carry `'unsafe-eval'`, do not emit CLICK rows — give the row an `href` your app
handles instead.

The compiled function runs in **global scope**: it sees `window` and nothing else — not React state,
not props, not this package. `FreshworksWidget('open')` works because the widget put itself on
`window`; `setState(…)` never will.

**Because the string is executed verbatim, whoever can write the row can run script in the page.**
Keep that column administrator-only, and never populate it from anything an end user can set.

A CLICK row is a real `<button type="button">`, never `<a href="#">`, and is never highlighted as the
current route whatever `href` it happens to carry.

## Brand marks

Nothing about the brand is hard-coded. Four components:

| Component | Is | Entry |
|---|---|---|
| `BrandMark` | the gradient box on its own | main + `./brand` |
| `Favicon` | mark + collapsing wordmark — the desktop lockup, the `favicon` slot | main only (needs `motion`) |
| `Logo` | the mark alone — the sub-`lg` header slot | main + `./brand` |
| `AuthLogo` | the stacked lockup for a login page | main + `./brand` |

| Prop | On | |
|---|---|---|
| `brandName` | `Favicon` `AuthLogo` | the wordmark. Defaults to the exported `DEFAULT_BRAND_NAME` placeholder (`"Executive Insight"`) — compare against it to tell "nobody set this" from "someone chose this". `Logo` renders no wordmark and takes none |
| `mark` | all | **any element** rendered in the gradient box: a lucide icon, an MUI icon, an inline `<svg>`, an `<img>`, text |
| `markSrc` / `markAlt` | all | convenience for an image mark — renders an `<img>` sized to the glyph box |
| `wordmarkSrc` / `wordmarkAlt` | `Favicon` | renders the wordmark as an **image** instead of `brandName` text. Independent of `markSrc` — a tenant usually has a favicon-shaped mark AND a full logo, at two different endpoints. `wordmarkAlt` defaults to `brandName`, since the image is then the only thing naming the brand |
| `size` | all | box size in px; radius, glyph and glow all derive from it. Default 32, and 48 on `AuthLogo` |
| `bare` | all | drops the gradient box, glow and radius, and shows the glyph at **full** size. `size` then means HEIGHT, not a box: the artwork keeps its own aspect ratio, capped at `--il-mark-max-width` |
| `miniSidebar` | `Favicon` | collapses the wordmark to zero width. Drive it from the same state as the sidebar |
| `tagline` | `AuthLogo` | the pill under the wordmark, default `"Enterprise"`. `null` removes it |

**`bare` is the one that gets forgotten.** The default boxes the glyph and paints it at half the box
— right for an icon, wrong for a tenant's finished logo file, which then gets a gradient box nobody
asked for and a 759×458 wordmark painted at 32×19. **Whenever the mark is a supplied file, pass
`bare`.** That is also why `bare` is an explicit prop rather than something inferred from `markSrc`:
with no session there is no `markSrc`, and the package must still fall back to its own boxed glyph.

```jsx
<Favicon brandName="Northwind" mark={<Rocket />} />
<Favicon brandName="Northwind" markSrc="/favicon.ico" bare />
<AuthLogo brandName="Northwind" markSrc="/logo.svg" tagline={null} />
```

A direct `<svg>` or `<img>` child is sized to the glyph box and inherits white, so `currentColor` icon
sets and a supplied logo file both land without arithmetic against `size`. `markAlt` defaults to `""`
because the wordmark beside the mark already names the brand — `Logo` has no wordmark, so give that
one a real label.

## `ProfileMenu`

The identity block for the header's profile dropdown — photo or initials, name, email and a logout
link. It goes in `profile.menu`.

| Prop | |
|---|---|
| `name` | display name, and the source of the initials when `initials` is absent |
| `email` | shown under the name. Capped at 30 characters AND at the panel width; the full address stays in `title` |
| `photoSrc` | a plain URL — `https:`, `data:` or `blob:`. Absent **or failing to load** falls back to initials; a later, different URL is retried |
| `photoAlt` | defaults to `""` (the name is rendered as text beside it). Give it a real value when you supply `initials` with no `name` |
| `initials` | overrides the two letters derived from `name` |
| `size` | avatar diameter in px, default 46 |
| `logoutHref` | where logout points. **Nothing renders when absent** |
| `logoutLabel` | default `"Logout"` |

**It does not fetch the photo, and that is deliberate.** The reference host's photo endpoint requires
a bearer token, which an `<img src>` cannot send — the request 401s and every user gets the
placeholder. Fetch the bytes yourself and hand over an object URL. `initialsFrom(name)` is exported
for the same reason: it tolerates `""`, `null` and double spaces, where the obvious `split(" ")`
version renders `"undefined"`.

There is **no default identity** — an absent name renders empty, not `"John Deo"`. The initials chip
is `aria-hidden` only while a name is rendered beside it; supply `initials` with no `name` and it
becomes `role="img"` with the letters as its label, because it is then the only identity on screen.

`logoutHref` is a plain `<a>`, not a router link — under a `basePath` you concatenate it yourself, or
it works in `next dev` and 404s deployed. Where to point it, and the photo fetch:
[references/wiring.md](references/wiring.md).

## `Footer`

The page footer (1.5.0). It goes in `FullLayout`'s `footer` slot, or at the bottom of a
hand-assembled shell. A `<footer>` on a three-column grid — `startSlot`, centre, `endSlot`.

| Prop | |
|---|---|
| `year` | `number \| string`, default the current year. Pass it explicitly on a statically exported page — the default is read at render, so a build cut on 31 December and served after midnight hydrates against a different year (the default is rendered with `suppressHydrationWarning`) |
| `siteName` | `ReactNode`, shown after the `©` and a `\|` separator. Absent or empty → no name and no separator |
| `siteHref` | where `siteName` points. Without it the name is plain text. The link opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) |
| `startSlot` `endSlot` | the side columns. A language picker or a version string belongs in `endSlot`. Both columns stay in the DOM when empty, so the centre stays centred on the page |
| `children` | **replaces the whole centre** (`© year \| siteName`) — legal links, a status badge. `year` and `siteName` are then ignored |
| `className` | extra class on the `<footer>` |

```jsx
import { FullLayout, Footer } from "@devopsnext/starterkit-layout";

<FullLayout footer={<Footer siteName="Think Talent" siteHref="https://example.com" />} … />
```

Content is props and slots only — **no i18n and no language `<select>`** (the source's one never
worked and was dropped). Translate in the host and hand over the string. When `footer` is present
the content column gets `.il-has-footer` and becomes a flex column that pins the footer to the
bottom on a short page; with no footer the column stays the plain block it was. Below `md`
(767.98px) the three columns stack, and an empty side column is dropped.

## Hooks

The three `FullLayout` already calls, exported so a hand-assembled shell does not re-derive them.
**Do not call them alongside `FullLayout`** — `useDrawerChrome` in particular would double the
body-overflow save/restore.

| Hook | |
|---|---|
| `useHeaderAutoHide({ shellRef, headerSelector?, enabled? })` | → `{ hidden, topbarHeight }`. Tracks scroll direction and measures `--il-topbar-height` off the shell element. `shellRef` is load-bearing: this package declares nothing on `:root`, so reading `documentElement` instead would report `null` forever and the sidebar would never dock |
| `useIsDesktop(query = LG_QUERY)` | `matchMedia`, SSR-safe |
| `useDrawerChrome({ open, onClose, pathname, isDesktop })` | the three dismissals a drawer needs but its own markup cannot own — Escape, route change, crossing up into desktop — plus a body scroll lock that saves and restores the host's own `overflow` |

Also exported: `Header` and `Sidebar`, for a shell you assemble yourself — `FullLayout` is the wiring
between them, not a wrapper that hides them. Both take a `staggerDelay` (seconds per row, `0`
disables the entry animation) that `FullLayout` does not forward. `NavItemContainer` and `NavSubMenu`
are the row primitives underneath the sidebar; `IconButton`, `MenuIcon` and `SearchIcon` are the
small parts; the constants are `LG_BREAKPOINT` (992), `LG_QUERY`, `DEFAULT_MOBILE_SIDEBAR_ID`
(`"il-mobile-sidebar"`) and `DEFAULT_BRAND_NAME`.

## The two namespaces — package-owned, do not redefine

- **`.il-*`** — 62 classes. `.il-shell` and `.il-brand` are **also the token alias scope**
  (`:is(.il-shell, .il-brand)`), so redefining either is not merely a style clash — it can strand the
  alias block.
- **`--il-t-*`** — 29 vendored token aliases, each `--il-t-X: var(--X, <vendored default>)`.
  **Generated** upstream by `pnpm sync:tokens`. Never hand-edit one and never set one yourself; set
  the design token it reads.
- **`--il-*`** (one dash) — 18 geometry properties this package owns, absent from the token sheet.
  The one-dash difference is what keeps the codegen's scraper off them. **This is the layer you
  override**, and it must be declared on `.il-shell`.

The package declares **nothing on `:root`**. A CSS fallback applies only to an *absent* custom
property, so your `--fg2` wins wherever you define it and the vendored value renders the shell where
you do not. Priority falls out of the mechanism — no load-order rule to get wrong, and no `@layer`.

Full inventory, the light/dark three-selector rule, the painted content column and the
equal-specificity caveat against Bootstrap: [references/namespace.md](references/namespace.md).

## Accessibility — already handled, do not undo

- The off-canvas drawer is marked `inert` below `lg` while closed. Without it a keyboard user tabs
  into a menu parked off-screen. Do not override it, and do not force `isDesktop`.
- Auto-hide never fires while focus is inside the header — hiding marks it `inert`, which would drop
  focus to `<body>`. A `headerSelector` that does not match the real header reintroduces exactly that.
- The hamburger keeps a **stable** accessible name and moves `aria-expanded`. Swapping the label to
  "Close menu" would announce "Open menu, expanded".
- Nav rows are `<li>`s directly inside the `<ul>`, never `ul > div > li`. **Slot content that drops a
  bare `<div>` into that list is a WCAG 1.3.1 failure and costs screen-reader users the list
  semantics entirely** — wrap it yourself. (`headerCenterSlot` is already wrapped in
  `<li className="nav-item">`.)
- The overlay is a `<button>` with an accessible name, not a `<div>`.
- A truncated nav label's tooltip (1.6.0) shows on focus as well as hover, stays while the pointer is
  on it, and closes on Escape (WCAG 1.4.13). It is `aria-hidden` because the full title is already the
  row's accessible name — do not add a `title` attribute on top, or the browser paints a second tooltip.
- There is **no focus trap** on the drawer — only `inert`, Escape and the scroll lock.

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| Restyle `.il-*` in app CSS | Package namespace; `.il-shell`/`.il-brand` are also the token alias scope | override a `--il-*` on `.il-shell`, or change a design token |
| Feed a tenant's `markSrc` in without `bare` | The gradient box clips it and halves it — a 759×458 logo painted 32×19 | `bare` whenever the mark is a supplied file |
| Feed the same URL to `markSrc` and `wordmarkSrc` | Paints one picture twice at two sizes; the two endpoints exist because they are two different pictures | favicon endpoint → `markSrc`, logo endpoint → `wordmarkSrc` |
| `sidebarUser={{ initials: "", name: "" }}` | Empty strings still render an empty avatar | spread it conditionally; omit it when there is no user |
| Pass `t` to both `toNavItems` and `FullLayout` | `t(t(key))` — invisible until a key resolves | pick one place; `FullLayout` also covers captions |
| A toggling `onCloseMobile` | It fires on already-closed transitions too, so it reopens the drawer | `() => setDrawer(false)` |
| Call `useDrawerChrome` alongside `FullLayout` | Doubles the body-overflow save/restore | it is already called internally |
| Read a store inside a shell slot to get `miniSidebar` | That is exactly what made the original shell uncopyable | pass it in as a prop |
| Nest a group inside a group | One level only; deeper children are not rendered | flatten |
| Import the main entry on a login page | Drags reactstrap, simplebar and motion into that bundle | `@devopsnext/starterkit-layout/brand` |
| Point `logoutHref` at the OAuth service's `/logout` | Leaves the path-scoped cookies; the next visit is a signed-in-looking shell that 401s on every call | the app's own logout route, which clears them first |
| Paint `.il-content-area` yourself to "fix" light mode | The package owns that property at equal specificity, so source order decides and it flips on an import reorder | change `--surface`, or paint the child that should read raised |
| `-var(--il-sidebar-width)` | Invalid CSS, dropped silently — un-hides the mobile drawer below `lg` with no error | `calc(-1 * var(…))` |
| `--il-shell-top: 0` | A bare `0` invalidates the downstream `calc()`s | `0px` |
| Declare a derived `--il-*` on `:root` | It freezes the default, so the `geometry` prop is silently ignored | declare it on `.il-shell` |
| Keep `search={false}` from ≤1.1.0 | The slot is gone; it is now an ignored unknown prop that reads as configuration | delete it; render your own into `headerCenterSlot` |
| Populate `event` from user-editable data | It is `new Function(string)` in global scope — script injection | administrator-only column, or use `href` |

## Red flags — stop

- **The shell renders as a vertical stack and nothing errored.** Bootstrap 5.3 utility CSS is not
  loaded. This is the one silent prerequisite; check it before debugging anything else.
- **You are bumping from ≤1.1.0.** `Logo` exists in both and means **opposite things** — 1.2.0 renamed
  the lockup to `Favicon` and gave the old `LogoIcon`'s meaning to `Logo`. A blind bump compiles and
  silently swaps the lockup for a bare mark. `brand` → `favicon` and `brandCompact` → `logo` moved at
  the same time, and the `search` slot was removed.
- **You are bumping from ≤1.3.x.** 1.4.0 dropped the Next.js peer: rows are plain anchors, and
  `pathname` no longer drives active matching. A nav row you expected to client-navigate is now a
  document load.
- **You are bumping from ≤1.4.1.** 1.5.1 (shipped as 1.5.2 — 1.5.1 was never published) changed the
  sidebar's row box: fixed 40px/36px row heights, one 8px gap, no `mb-2` on rows. A pixel-tuned
  override of `.nav-link` padding or margin, or a selector on `.nav-link.mb-2`, no longer lands.
- **You are bumping from ≤1.5.2.** 1.6.0 narrowed the open sidebar from 240px to **204px** and dropped
  nav text to 12px, so a layout that assumed 240px of content offset, or a screenshot baseline, moves.
  If you want the old width back, pass `geometry={{ sidebarWidth: 240 }}` — do not restyle
  `.il-sidebar-box`. Row titles are now `<span class="il-nav-label">` inside the row instead of a bare
  `<span>`, so an app selector like `.nav-link span:first-child` may now hit a different element.
- **You are writing a colour, radius or shadow literal into a shell override.** Everything the shell
  paints comes from a design token — see the `starterkit-theme` skill.
- **You are adding a CSS rule for an `.il-*` class that also carries a Bootstrap component class**
  (`.il-topbar.navbar`, `.il-mega.dropdown`). Equal specificity → source order decides. Write the
  compound selector, or your rule loses on an import reorder.
- **You are about to `link:` this package for local development.** `Invalid hook call`. Use
  `pnpm pack`.
- **You are enabling `'unsafe-eval'` in your CSP because the shell asked for it.** Only CLICK rows
  need it. If you emit none, do not add it.
- **You are filtering nav rows inside a slot or a mapper to hide unauthorized ones.** Filter before
  `toNavItems`. Hiding a row is not authorization.

## Staleness — how to re-derive

Everything here is derived from one published version. When the installed version has moved past the
one in [Documented against](#documented-against), re-derive **before** trusting a table. Nothing in
this section is remembered; all of it is a command.

```bash
npm view @devopsnext/starterkit-layout version
```

```bash
sha256sum node_modules/@devopsnext/starterkit-layout/dist/index.d.ts node_modules/@devopsnext/starterkit-layout/dist/brand.d.ts node_modules/@devopsnext/starterkit-layout/styles.css
```

Compare the first 12 hex of each against the table. If `index.d.ts` moved, read it — it is the whole
prop surface. If `brand.d.ts` moved, the marks changed, and the `Logo`/`Favicon` history above says
how badly that can go silently.

Re-derive the inventories rather than trusting the counts:

```bash
grep -oE "\.il-[a-z0-9-]+" node_modules/@devopsnext/starterkit-layout/styles.css | sort -u
```

```bash
grep -oE -- "--il-[a-z0-9]+(-[a-z0-9]+)*" node_modules/@devopsnext/starterkit-layout/styles.css | grep -vE "^--il-t($|-)" | sort -u
```

**A fingerprint over `.d.ts` files cannot see CSS rule bodies, and that gap has bitten before.**
1.1.0 repainted the content column, added a token alias and rewrote seven vendored fallbacks while
every type fingerprint stayed identical. When the version is the only field that moved, that is not
"nothing changed" — it is "nothing a type check can see changed". Diff the stylesheet:

```bash
git -C <path-to-starterkit-layout> log --oneline -- styles.css
```
