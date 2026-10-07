---
name: starterkit-skeleton-loader
description: Use when adding, replacing, reviewing or debugging any loading state, skeleton, placeholder, shimmer or "loading…" spinner in a React or Next.js app that uses @devopsnext/starterkit-skeleton-loader — wrapping content in `<AutoSkeleton>`, choosing between `fixture`, `name`, `captured` and `mode="css"`, installing or pinning the package, running the `auto-skeleton` capture command, setting up `skeleton:capture` / `skeleton:list` scripts in package.json so one command generates every skeleton in the project, writing or refreshing a `.bones.json`, and diagnosing symptoms like a skeleton that is one grey block, a wrapper that collapses to zero height, a page that is blank until JavaScript loads, Bootstrap columns losing their gutters, a fetch that fires twice, bones in the wrong colour, a stale captured shape, or `Invalid hook call` after a `link:` install.
license: MIT
compatibility: React 18+ consumer with @mui/material >= 6 (and the Emotion packages MUI needs), ESM or CJS. The capture command additionally needs Playwright in the host project and the app running. Install commands are shown for pnpm; npm and yarn work the same way.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-skeleton-loader

`@devopsnext/starterkit-skeleton-loader` is one component, `<AutoSkeleton>`. Wrap content in it
and, while `loading` is true, it draws a skeleton shaped like that content — measured from the DOM
and painted with MUI's `<Skeleton>`. The package ships **no CSS**; bone colour, animation and dark
mode come from the host's MUI theme.

**Do not draw a skeleton. Give the wrapper something real to measure.**

> A skeleton can only be shaped like content that exists. Every bad result below is the wrapper
> having nothing to measure — or someone hand-writing a placeholder next to the real component,
> which is the thing that goes stale and the thing this package exists to delete.

## Documented against

| | |
|---|---|
| Package version | **0.2.0** — npm `latest` on 2026-10-08, published 2026-10-07T19:35:52Z |
| Type-surface fingerprint | `7375a89cbe31` — sha256 of `dist/index.d.ts`, first 12 hex ([command](#staleness--how-to-re-derive)) |
| Source | <https://github.com/thinktalentservice-ai/starterkit-skeleton-loader> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-skeleton-loader> |

**How much to trust each section:** the props, attribute, DOM-contract and "what becomes what"
tables are derived from `dist/index.d.ts`, `src/AutoSkeleton.tsx`, `src/extract.ts` and
`bin/auto-skeleton.mjs` — authoritative. *Choosing* and *Anti-patterns* are judgement. There is no
Storybook; the package's own README is the long-form reference. If the installed version has moved
past 0.2.0, see [Staleness](#staleness--how-to-re-derive) before trusting a table.

## Install — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that literal version
number*.

```bash
npm view @devopsnext/starterkit-skeleton-loader version
```

```bash
pnpm add @devopsnext/starterkit-skeleton-loader@<version-from-step-1>
```

At the time this file was written step 1 answered `0.2.0`. `package.json` must end up holding the
bare number — `"@devopsnext/starterkit-skeleton-loader": "0.2.0"`. **Open it and check.** If your
client widened it to `"^0.2.0"`, re-add with `--save-exact` (npm/pnpm) or `--exact` (yarn).

**Why not `@latest`.** It installs the same code but records a **caret** range, and on a `0.x`
package a caret still admits patch releases nobody reviewed. This package decides what every
loading state on the screen looks like; take a new version deliberately, on a line someone can read.

**Not 0.1.0.** Its tarball shipped `bin/auto-skeleton.mjs` with a CRLF shebang. Some package
managers repair that at install and some do not; where it is not repaired the command fails on
Linux and macOS with `env: 'node\r': No such file or directory`. The library code is identical —
only the command was broken — so the fix is the pin, not a workaround.

Peer deps: `react` and `react-dom` >= 18, `@mui/material` >= 6. In an app with no MUI yet:

```bash
pnpm add @mui/material @emotion/react @emotion/styled
```

No stylesheet to import. The build carries `"use client"`, so it is a client component under the
Next.js App Router, and it works with `output: "export"` — nothing runs on a server.

```jsx
import { AutoSkeleton } from "@devopsnext/starterkit-skeleton-loader";
```

### Never consume this package via `link:`

A `link:` to a sibling checkout gives the app a second copy of React and of MUI's theme context.
Hooks throw `Invalid hook call`, or — worse — everything renders with the bones in MUI's default
grey because they read a theme provider the app never mounted. To try an unpublished build,
`pnpm build && pnpm pack` in the package and install the tarball.

### A host with a release-age policy

If the host's `pnpm-workspace.yaml` sets `minimumReleaseAge`, a version published inside that
window is refused with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. That is the policy working. Follow
the host's own procedure for an exclusion (in the Think Talent template: a
`minimumReleaseAgeExclude` entry carrying the publish time from `npm view <pkg> time --json`).

One trap when bumping twice inside the window: pnpm verifies the **existing** lockfile against the
policy before it re-resolves. If the version you are leaving is itself still too new, deleting its
exclusion first fails the install on the version you are trying to leave. Keep both entries for
the install, then delete the old one.

## Choosing — what will it measure?

Answer this first; everything else follows from it.

| The content, while loading… | Use | First load | Cost |
|---|---|---|---|
| is a component you can render with fake data | **`fixture`** — the default answer | exact | none |
| already draws its layout before its data arrives | nothing — `children` is measured | exact | none |
| renders nothing until loaded, and reloads later | **`name`** (+ `minHeight`) | one block | none |
| does not exist until JavaScript has run (table themed from `getComputedStyle`, chart, anything behind `useEffect`) | **`captured`** + `name` | exact, even before hydration | a committed file, re-captured by hand |
| none of the above | `minHeight` only | one rounded block | — |

When more than one applies the most exact wins: a live measurement, then the shape remembered
under `name`, then `captured`, then the block.

**Reach for `fixture` before anything else.** It works on the very first load, needs no build
step, and cannot go stale because it *is* the component.

```jsx
<AutoSkeleton loading={isLoading} fixture={<UserRow user={{ name: "Placeholder name", role: "Role" }} />}>
  {user && <UserRow user={user} />}
</AutoSkeleton>
```

- **For a list**, render the fixture as many times as you expect rows.
- **Text bones follow the fixture's text.** A longer placeholder name gives a wider bar — write
  placeholder copy of typical length, not `"x"` and not lorem ipsum.
- **The fixture really renders.** Its effects run and its images load. Feed it static placeholder
  data; a fixture that fetches is a second request for data you are already waiting on.
- **Fixture and children are separate instances**, even of the same component. The children stay
  mounted (hidden with `display: none`) so their state survives a reload — and their effects run
  during loading, exactly as they would without the wrapper.

**`name` alone learns as it goes.** The loaded shape is remembered for the page session, once
entrance animations have finished. The first load has nothing to go on, so give it a `minHeight`;
a later load (a refetch, coming back to the route) gets the real shape — *provided the wrapper is
within 1px of the width it was learned at*. Bones are pixels; a shape learned wider would paint
over whatever sits beside it, so it is dropped instead.

**`captured` is the only one that costs upkeep.** Use it when there is genuinely nothing in the
HTML to measure. It is a `.bones.json` you generate with a command, commit, and re-generate after
a layout change. Read [references/capturing.md](references/capturing.md) before adding one, and
set up [project-wide capture](#project-wide-capture--set-it-up-once-in-packagejson) in the same
change so the file has a command that refreshes it.

## Project-wide capture — set it up once, in `package.json`

The moment a project has one `captured` skeleton it needs a command that refreshes it, and the
obvious one — `"skeleton:capture": "auto-skeleton --url <that page>"` — is a list of URLs somebody
has to remember to extend. The second captured page gets forgotten, keeps importing a file nobody
re-captures, and nothing fails.

So **do this when you add the first `captured`, or when you find a hand-kept `--url` line**: give
the project a `skeleton:capture` that reads the list out of the source. This skill ships the two
scripts that do it. `<skill-dir>` below is the directory this `SKILL.md` is in — typically
`.claude/skills/starterkit-skeleton-loader` or `.agents/skills/starterkit-skeleton-loader`.

1. **Look first.** Open `package.json`. If `skeleton:capture` already runs
   `scripts/skeleton-capture.mjs`, the project is set up — skip to step 5.
2. **Dry run**, from the project root, and read what it says it would do:
   ```bash
   node <skill-dir>/scripts/setup-capture.mjs --dry-run
   ```
3. **Run it** without the flag. It copies `skeleton-capture.mjs` into the project's `scripts/`
   and adds to `package.json`, keeping the file's indentation and line endings:
   ```json
   "skeleton:capture": "node scripts/skeleton-capture.mjs",
   "skeleton:list": "node scripts/skeleton-capture.mjs --list"
   ```
   It **stops rather than overwrite** an existing `skeleton:capture` that says something else.
   Write down that line's URLs and flags, re-run with `--force`, and carry any flag that mattered
   (`--max-height`, `--breakpoints`, `--wait`) into the `DEFAULTS` constant at the top of the
   copied script — otherwise the next capture silently changes every file.
4. **Add what it reports missing** — `@babel/parser` and `playwright` as dev dependencies. It
   prints the command and installs nothing itself, because how a dependency is added (exact pin,
   release-age policy) is the host's rule, not this skill's.
5. **Check the list before trusting it.** No browser, no server needed:
   ```bash
   pnpm skeleton:list
   ```
   Every `captured` wrapper should be there with the URL you would type yourself — base path and
   trailing slash included. Every URL from an old hand-kept line should be accounted for.
6. **Capture, with the app running**, and read the diff:
   ```bash
   pnpm skeleton:capture
   ```
   With no layout change since the last capture, `git diff` on the `.bones.json` files should be
   empty. A diff here means the old capture was stale or the flags from step 3 were not carried
   over — find out which before committing.
7. **Write it down in the project's README** — the two commands, that the app must be running,
   and "re-run after any layout change to a captured component". A capture nobody knows to
   refresh is the failure this whole section exists to prevent.
8. **Commit together**: `scripts/skeleton-capture.mjs`, `package.json`, the lockfile, the README.

What the project has afterwards:

| Command | Does |
|---|---|
| `pnpm skeleton:list` | Prints every named wrapper — captured ones with their file and URL, runtime ones marked as needing no file. |
| `pnpm skeleton:capture` | Captures every `<AutoSkeleton captured>` in the project. **Exits 1 if any expected file was not rewritten.** |
| `pnpm skeleton:capture --name orders` | One skeleton. Any other `auto-skeleton` flag passes through. |
| `pnpm skeleton:capture --name new --url <url>` | First capture of a skeleton that has no `captured` prop yet. |

It reads the base path (`NEXT_PUBLIC_BASE_PATH`, from the environment or the project's `.env`
files) and `trailingSlash` from the project, and derives each URL from the Next.js App Router page
file the wrapper sits in. It cannot derive a route for a wrapper in a shared component or under a
`[dynamic]` segment, and says so by name — pass `--url` for those. For any other router, the
`routeOf` function in the copied script is the one thing to rewrite.

**Do not wire it into `prebuild`, a gate or CI.** It needs a running server and a browser, and
its output is a file a person reviews. Details, failure messages and the login case are in
[references/capturing.md](references/capturing.md).

## Props

| Prop | Type | Default | |
|---|---|---|---|
| `loading` | `boolean` | required | Show the skeleton. |
| `children` | `ReactNode` | | The real content. Always mounted. |
| `fixture` | `ReactNode` | | Content to measure while loading. |
| `name` | `string` | | Key the last measured shape is remembered under; also how the capture command finds the wrapper. |
| `captured` | `CapturedSkeleton` | | The imported `.bones.json`. Needs `name`. |
| `mode` | `"measure" \| "css"` | `"measure"` | `"css"` stays on the CSS skeleton and never measures. |
| `animation` | `"pulse" \| "wave" \| false` | `"pulse"` | Passed to MUI `<Skeleton>`. `false` also stills the CSS skeleton. |
| `minHeight` | `number \| string` | | Reserves space for an empty wrapper. |
| `boneColor` | `string` | MUI's | Any CSS colour. Reaches both skeletons. |
| `boneSx` | `SxProps<Theme>` | | Every **measured** bone only. |
| `sx`, `className` | | | The wrapper. |

Also exported: `extractBones(element, { origin? })` — the pure DOM read the component uses — and
`clearSkeletonCache()`, which forgets every `name`. Types: `AutoSkeletonProps`, `Bone`,
`BoneClip`, `BoneVariant`, `CapturedSkeleton`, `ExtractOptions`, `SkeletonSnapshot`,
`SurfaceStyle`.

### Colour comes from a token, through `boneColor`

```jsx
<AutoSkeleton loading={isLoading} boneColor="var(--surface-elevated)">…</AutoSkeleton>
```

`boneColor` is published as `--auto-skeleton-bone` on the wrapper and read by the measured bones,
the CSS skeleton and captured frames alike. `boneSx={{ bgcolor: … }}` recolours the measured bones
**only** — the page then changes colour at the moment of hydration. In an app on
`@devopsnext/starterkit-theme`, pass a token; never a hex.

## The wrapper is one element, and child selectors do not see through it

The wrapper is a single `position: relative` box. The content inside is `display: contents`, so it
is laid out as the wrapper's direct children: `className="grid"` or `sx={{ display: "flex" }}` on
`AutoSkeleton` behaves as it would on a plain `<div>`.

**CSS child selectors are the exception.** `.row > *` matches DOM children, and the wrapper's DOM
children are its own two elements, not your columns. Bootstrap's gutters are the usual casualty —
wrap the row, do not replace it:

```jsx
<AutoSkeleton loading={isLoading} fixture={<Row>{placeholders}</Row>}>
  <Row>{cards}</Row>
</AutoSkeleton>
```

## Steering the result

Attributes on elements **inside** the content:

| Attribute | Effect |
|---|---|
| `data-skeleton-ignore` | Skip this element and everything in it. |
| `data-skeleton-leaf` | Draw this element as one bone; do not look inside. |
| `data-skeleton-variant="text\|circular\|rounded\|rectangular"` | Force the MUI variant. |

`data-skeleton-leaf` is the one you will use: a logo tile, a chart canvas wrapper, an image that
fades in from `opacity: 0`, an avatar that is a painted `<div>`.

## What becomes what

| In the content | In the skeleton |
|---|---|
| Text | One bar per rendered line, as wide as the words. |
| `img`, `svg`, `button`, `input`, `select`, `textarea`, `video`, `canvas`, `iframe` | One bone the size of the element. |
| A small painted box (up to 160 × 64px) holding at most two pieces — avatar, chip, badge, icon button | One bone. |
| Any other box with a background, border or shadow — card, panel, toolbar | Its **frame**, repainted as it is, with its content drawn inside. |
| A table cell | Always a frame around its content, never a bone. |
| An empty box that paints nothing | Nothing. |

Content cut off by an ancestor's `overflow` is cut off in the skeleton too. It re-measures when the
wrapper or window resizes, when the content's DOM changes, when an image inside loads and when web
fonts arrive — so it is responsive with no breakpoint list.

## Before JavaScript has measured — the CSS skeleton

Server-rendered and statically exported HTML contains the content but cannot contain a
measurement: there is no layout at build time. Until hydration the content itself is restyled into
a skeleton with CSS — colours go transparent, each line of text is struck through with a
bone-thick line, images and controls are filled bone-colour, card frames stay. None of it changes
layout, so nothing moves when the measured skeleton takes over.

**This is the only skeleton some visitors see.** A page whose loading state ends at hydration
(data read from `localStorage` in an effect, say) never shows the measured one. So check it: load
the page with JavaScript disabled, or throttled.

It is an approximation. Know where it differs:

- A painted box with no children (an avatar `<div>` with a background) keeps its own colour →
  `data-skeleton-leaf`.
- Text mixed with non-inline children (`<div>Label <svg/></div>`) gets no bar for the loose text.
- Text in an `inline-block`, `inline-flex` or floated child of a paragraph gets no bar.
- `boneSx` does not reach it → `boneColor`.
- It needs `:has()` — every current browser, none before 2023.

`mode="css"` uses it everywhere and never measures. It cannot fall back to the block when the
content renders elements with nothing drawable in them (an empty `<ul>`): it never measures, so it
cannot tell.

## Rendered DOM contract

```html
<div data-auto-skeleton data-auto-skeleton-name="orders" aria-busy="true" style="--auto-skeleton-bone: …">
  <div data-auto-skeleton-content aria-hidden="true" inert>   <!-- display: contents -->
    <div data-auto-skeleton-shown>…fixture…</div>
    <div style="display: none">…children…</div>
  </div>
  <div data-auto-skeleton-overlay aria-hidden="true">…bones…</div>   <!-- only while loading -->
</div>
```

Select on these in a test or the capture command; do not style them from app CSS. When `loading`
is false the overlay is gone, and `aria-busy`, `aria-hidden` and `inert` are absent — not `"false"`.
The capture command decides "still loading" from `aria-busy="true"`.

## Accessibility — what is handled, and what is yours

Handled: loading content is `inert` and `aria-hidden`, so it cannot be focused, clicked or read;
the overlay is `aria-hidden` and ignores the pointer; the wrapper sets `aria-busy`.

Yours:

- **Nothing announces the loading state.** `aria-busy` is not an announcement. Add a live region
  if a screen-reader user needs to hear that something is loading or has arrived.
- **Focus is not managed.** If focus is inside the content when `loading` turns true it falls back
  to `<body>`. Move it yourself if that matters.

## Copy-paste patterns

```jsx
/* The default: real component, placeholder data. */
<AutoSkeleton loading={!account} boneColor="var(--surface-elevated)"
  fixture={<AccountCard account={PLACEHOLDER_ACCOUNT} />}>
  {account && <AccountCard account={account} />}
</AutoSkeleton>

/* A grid of cards behind Bootstrap's row. */
<AutoSkeleton loading={!accounts} name="accounts"
  fixture={<Row>{PLACEHOLDERS.map((a) => <AccountCard key={a.key} account={a} />)}</Row>}>
  <Row>{cards}</Row>
</AutoSkeleton>

/* Renders nothing until loaded; learns its shape for the next load. */
<AutoSkeleton loading={isFetching} name="invoice-table" minHeight={240}>
  {rows && <InvoiceTable rows={rows} />}
</AutoSkeleton>

/* Cannot exist before JavaScript runs: ship a captured shape. */
import ordersBones from "@/skeletons/orders.bones.json";

<AutoSkeleton loading={!ready} name="orders" captured={ordersBones}>
  {ready ? <OrdersTable /> : null}
</AutoSkeleton>
```

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| A hand-written `<SkeletonCard>` beside the real card | Two layouts to keep in step; the drawing loses | `fixture={<Card data={PLACEHOLDER} />}` |
| A fixture that calls the API | It really renders — that is a duplicate request | static placeholder data |
| `fixture` placeholder text like `"x"` or lorem ipsum | Bars are as wide as the words | copy of typical length |
| Replacing a Bootstrap `<Row>` with `AutoSkeleton` | `.row > *` no longer reaches the columns | wrap the row |
| An empty wrapper with no `minHeight` | Zero pixels tall — an invisible skeleton | `minHeight`, or a fixture |
| `captured` where a `fixture` would do | A file to re-generate by hand, for nothing | `fixture` |
| `captured` without `name` | The capture command finds wrappers by name | add a literal `name` |
| Editing a `.bones.json` by hand | Overwritten by the next capture | re-run the capture |
| `boneSx={{ bgcolor }}` for the bone colour | Misses the CSS skeleton; colour jumps at hydration | `boneColor` |
| A hex in `boneColor` | Pins one brand and one scheme | a token: `var(--surface-elevated)` |
| `visibility: hidden` to hide part of the content from the skeleton | That is how the measured content itself is hidden; the two cannot be told apart | `data-skeleton-ignore` |
| Styling `[data-auto-skeleton-*]` from app CSS | Package namespace | `sx` / `className` on the wrapper, `boneColor`, `boneSx` |
| `link:` to a sibling checkout | Two Reacts, two MUI theme contexts | `pnpm pack` and install the tarball |

Limits that are not mistakes, but will surprise you: content at `opacity: 0` gets no bone (add
`data-skeleton-leaf` to its container); a descendant with its own `visibility: visible` shows
through the measured skeleton; shadow DOM and `<iframe>` contents are not walked (an iframe is one
bone); scaled ancestors are handled, rotated or skewed ones are not — bones are axis-aligned boxes.

## Staleness — how to re-derive

This file documents 0.2.0. Nothing enforces that; check it. Compare what the registry publishes,
what `package.json` pins, and what is installed:

```bash
npm view @devopsnext/starterkit-skeleton-loader version
```

```bash
npm ls @devopsnext/starterkit-skeleton-loader
```

The fingerprint in the table at the top is the first 12 hex of the sha256 of the installed
`dist/index.d.ts`. Reproduce it:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-skeleton-loader'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

**Do not "simplify" that to `require('@devopsnext/starterkit-skeleton-loader/package.json')`.** The
`exports` map declares only `.`, so any subpath — `package.json` included — throws
`ERR_PACKAGE_PATH_NOT_EXPORTED`. Resolving the main entry and walking to its sibling is the way in.

`7375a89cbe31` means the type surface is the one these tables describe, whatever the version says.
If it has moved, re-derive **before** trusting a table, in this order:

1. `node_modules/@devopsnext/starterkit-skeleton-loader/dist/index.d.ts` — props, defaults in the
   doc comments, every exported type. **This is what the fingerprint hashes.**
2. `node_modules/@devopsnext/starterkit-skeleton-loader/README.md` — the long-form contract: how it
   works, what becomes what, the CSS skeleton's limits, the capture command.
3. `node_modules/@devopsnext/starterkit-skeleton-loader/bin/auto-skeleton.mjs` — the capture
   command's flags and exit codes, in its `HELP` string and last twenty lines.
4. The source repo — `src/AutoSkeleton.tsx` (rendering, the CSS skeleton, precedence) and
   `src/extract.ts` (the rules in *What becomes what*).

The fingerprint does **not** cover the capture command or the extraction rules: a release can
change which elements become bones without touching a type. If skeletons look different after a
bump and the fingerprint has not moved, read the README's *What becomes what* again and re-capture.

## Red flags — stop

- About to write a `<Skeleton>` layout by hand for a component that already exists → wrap it and
  pass the component as `fixture`.
- About to run `pnpm add …@latest`, `@^0`, or a bare `pnpm add <pkg>` → all of them record a
  **range**. Look up the latest version, then install that literal number.
- About to install the version this file names without re-checking the registry → check first.
- The skeleton is one grey rounded block → there was nothing to measure. Add a `fixture`.
- The skeleton is not there at all → an empty wrapper is zero pixels tall. `minHeight`.
- Columns lost their gutters or stacked → `AutoSkeleton` replaced a `.row`. Wrap it instead.
- A request fires twice, or an effect runs during loading → the fixture is a real render. Give it
  static data.
- The page is blank until the bundle arrives → the content does not exist before JavaScript runs.
  That is the one case for `captured`.
- About to reach for `captured` because the skeleton "looks off" → fix the fixture or add
  `data-skeleton-leaf`; a capture is upkeep, not a quality setting.
- A captured skeleton no longer matches the page → it is a file; re-run the capture and commit it.
- About to add a `captured` prop in a project with no `skeleton:capture` script → set up
  [project-wide capture](#project-wide-capture--set-it-up-once-in-packagejson) in the same change.
- About to add a page's URL to a `skeleton:capture` line by hand → that line is the thing to
  replace; run `setup-capture.mjs`.
- About to hand-edit `package.json` to add the capture scripts → run `setup-capture.mjs`; it will
  not overwrite a line that says something else without being told to.
- Bones are a different colour before and after hydration → `boneSx` was used for colour. `boneColor`.
- `Invalid hook call`, or bones in MUI's default grey despite a theme → a `link:` install.
- `env: 'node\r': No such file or directory` from `auto-skeleton` → the pin is 0.1.0. Move to 0.2.0+.
