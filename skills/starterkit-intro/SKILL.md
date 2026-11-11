---
name: starterkit-intro
description: Use when adding, wiring, writing, reviewing or debugging a per-page guided intro, product tour, onboarding walkthrough, coach marks or "Take a tour" help button in a React or Next.js app that uses @devopsnext/starterkit-intro — installing or pinning the package, mounting IntroProvider with a router's pathname and basePath, tagging elements with data-intro, writing or generating public/intro/<route>.json, running the starterkit-intro capture/list CLI, adding a lint:intro gate so a renamed tag fails CI, putting replay and an auto-start switch in a header menu, or diagnosing a tour that never starts, a step that is silently skipped, edited copy users never see, a one-line highlight strip, focus landing on body after the tour, a capture that reports "redirected to /login", or a CI failure on a file:*.tgz pin.
license: MIT
compatibility: React 18+ consumer, any router (Next.js App/Pages Router, React Router, plain React). Peers are react and react-dom only — no MUI, no Next. The capture command needs Playwright in the host project and the app running. Commands are shown for pnpm; npm and yarn work the same way.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-intro

`@devopsnext/starterkit-intro` shows a spotlight-and-popover tour for the page the user is on.
The tour's content is **a static JSON file per route** in `public/intro/`, fetched at runtime like
any other public asset. A missing file means "no intro here" — never an error.

**Every failure in this package is silent on purpose.** It never throws into your tree: a bad file
warns once and shows nothing, a missing target skips its step, an unedited draft never renders. That
is right for users and wrong for you — nothing on screen tells you the tour got shorter. So the first
thing a project needs after wiring is the static gate this skill ships (`lint:intro`).

## Documented against

| | |
|---|---|
| Package version | **0.1.0** |
| Type-surface fingerprint | `72d17c3a9550` — sha256 of `dist/index.d.ts`, first 12 hex ([re-derive](#staleness)) |
| Source | <https://github.com/thinktalentservice-ai/starterkit-intro> |

The package's own `README.md` (in `node_modules/@devopsnext/starterkit-intro/`) is the API and
schema reference. This skill does **not** repeat it; it covers what the README cannot: the gate,
the setup, tagging that survives real components, the header-menu pattern, and diagnosis.

## Install — exact pin, never `link:`

```bash
npm view @devopsnext/starterkit-intro version
pnpm add --save-exact @devopsnext/starterkit-intro@<that-version>
```

`package.json` must hold the bare number. A caret on a `0.x` package admits unreviewed patches.
**Never `link:`** a sibling checkout — two Reacts, `Invalid hook call`. To try an unpublished build:
`pnpm build && pnpm pack` in the package, then `pnpm add <path>/devopsnext-starterkit-intro-<v>.tgz`
from the host. A `file:*.tgz` pin is for local development only: a version-pin gate that fails on it
in CI is **working**, not broken — publish, then repin exact. A host with pnpm `minimumReleaseAge`
refuses a version published inside its window (`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`); follow
the host's own exclusion procedure for the repin rather than loosening the policy.

Import the stylesheet once, after your theme sheets: `import "@devopsnext/starterkit-intro/styles.css"`.

## Wiring — the two values the package needs

`<IntroProvider pathname baseUrl>` — the **router-relative** pathname and the URL of the intro folder.
Full snippets (Next App Router, Pages Router, React Router, header menu): [references/wiring.md](references/wiring.md).

| Router | `pathname` | `baseUrl` |
|---|---|---|
| Next App Router | `usePathname()` (already without `basePath`) | `` `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/intro` `` |
| React Router | `useLocation().pathname` (already without `basename`) | `` `${import.meta.env.BASE_URL}intro` `` |
| Plain React | `window.location.pathname` minus your mount prefix | wherever `public/intro` is served |

- **Next: `NEXT_PUBLIC_BASE_PATH` is yours to create**, with the same value as `basePath` in
  `next.config` — Next exposes `basePath` to neither the browser nor the CLI. Out of sync = 404 =
  "no intro", silently. The capture CLI reads it from the env or `.env*`; otherwise pass `--base-path`.
- **Vite `base` and the router `basename` are separate settings.** `baseUrl` follows Vite's `base`
  (where `public/` is served); `pathname` follows the router. If they differ, set each from its own.
- **Wrap the whole shell**, not only the page body, when the help menu lives in the header — the
  menu calls `useIntro()` and must be inside the provider.
- File for a route = the package's `routeToIntroPath`: `/` → `intro/index.json`,
  `/settings/profile/` → `intro/settings/profile.json`. The file's `"route"` must match.
- Mount it only around pages that should have intros (a dashboard shell, not login/callback pages).

## Tagging — the attribute has to reach a real, meaningful element

```jsx
<section data-intro="billing-summary" data-intro-title="Billing summary">…</section>
```

`data-intro` is the selector; `data-intro-title` is only the draft title the CLI proposes.

| Target is… | Do |
|---|---|
| a native element | put both attributes on it |
| your own component | make its root spread `...rest`, then tag the component — never add a wrapper div (it changes layout and breaks `.row > *`-style child selectors) |
| a third-party component | read its source: tag it only if it forwards unknown props to a DOM node |
| inside a library that takes props objects (`muiTableContainerProps`, `slotProps`) | `{ "data-intro": "orders-table" }` — the gate understands the object-key form |
| a layout region you don't own | a class selector (`.il-sidebar`) **with `"optional": true`** |

**Tag the thing the step explains, not the nearest taggable thing.** When a component won't forward
props, the tempting fallback is a caption line inside it — the tour then highlights a one-line strip
and reads as a glitch. Fix the component (`...rest`) instead. Never a positional selector
(`:nth-child`) — the CLI refuses them and they break on the next reorder.

## Content — capture drafts, write copy, gate it

```bash
node <skill-dir>/scripts/setup-intro.mjs --dry-run      # then without --dry-run
```

`setup-intro.mjs` copies the gate to `scripts/check-intro.mjs` and adds `lint:intro` (plus, for a
Next App Router app, `intro:list` / `intro:capture`). Flags: `--exclude /login` (repeatable),
`--no-landmarks`, `--storage-state <file>`, `--force`. It installs nothing and never edits your
build chain — **add `lint:intro` to your CI/prebuild yourself**; that is the point of it.

The loop, in detail in [references/authoring.md](references/authoring.md):

1. `intro:list` — check every route, URL and file before launching a browser.
2. `intro:capture` with the app running — new steps land as `"draft": true` with an empty body.
   Re-running **merges**: written copy is kept, new tags are appended as drafts, vanished targets are
   marked `"stale": true` (never deleted).
3. Write the copy, delete each `"draft"`. **Drafts never render** — an unedited placeholder cannot
   reach a user, and an all-draft file ships no tour.
4. `lint:intro` — must be green with no draft/stale warnings.
5. **Changed copy on a page users have already seen? Bump `"revision"`.** Auto-start fires once per
   route per revision; without the bump only people who never saw the old tour get the new one. The
   CLI never touches `revision`.

Landmark steps explain the shell, so they belong on one or two entry pages, not every page. Capture
everything with `--no-landmarks`, then add one landmark pass for the entry page(s) — a second script
such as `"intro:capture:shell": "starterkit-intro capture --next-app src/app --route /"`. Existing
landmark steps are kept and probed either way. The default landmark selectors
(`.il-topbar,.il-sidebar`) are `@devopsnext/starterkit-layout`'s classes; any other shell passes its
own with `--landmarks ".app-header,.app-nav"`.

## What `lint:intro` catches — and what it cannot

| Fails the build | Printed, never fails |
|---|---|
| schema error (unknown key, empty body on a shipped step, bad route) | draft / stale steps |
| file path ≠ `routeToIntroPath(route)` | non-`data-intro` targets it cannot see |
| route with no App Router page file (`--app-dir none` skips this) | route check skipped (no app dir) |
| `[data-intro="k"]` target with no `data-intro="k"` / `"data-intro": "k"` in source | |
| non-`data-intro` target that is not `optional` | |

Blind spots, by construction — **green does not mean every step renders**:

- **A component that swallows the prop.** `<Section data-intro="x">` puts the string in source, so the
  gate passes, while no DOM node carries it and the step is skipped. Same for a library that ignores
  a `"data-intro"` props key. Only a browser proves it: `intro:capture` (the step stays non-stale) or
  `document.querySelector('[data-intro="x"]')`.
- **The key check is global, not per page.** A key that exists on another page satisfies it.
- Class-selector targets (that is why they must be `optional`).
- Keys built at runtime (`` data-intro={`row-${id}`} ``) fail as missing — use literals.

So after tagging, re-run `intro:capture` once: a tag that did not reach the DOM never appears as a
new step, and an existing step whose tag stopped reaching it is marked `stale`. Compare the keys you
added in JSX with the step ids in the file.

## Diagnosis

| Symptom | Cause → fix |
|---|---|
| No tour, no warning | No file at `baseUrl/<routeToIntroPath>` (404 = no intro). Check the Network tab URL; usual culprit is `baseUrl` missing `basePath`. |
| `[starterkit-intro] ignoring …` in console | Schema error or `route` mismatch — run `lint:intro`. |
| Tour never auto-starts | Already seen at this `revision`, user switched auto-start off (`localStorage["starterkit-intro"]`), or every step is draft. |
| Step silently skipped | Target missing, zero-size, `display:none` or inside a closed menu/tab. Component not forwarding props is the common one. |
| Highlight is a thin strip | Tag landed on a caption — tag the section root (`...rest`). |
| Edited copy never shown | `revision` not bumped. |
| Focus on `<body>` after the tour, started from a menu | The tour returns focus to the element focused at start — a menu item the menu just hid. Focus the menu's toggle **before** `start()`; see wiring.md. |
| Capture: "redirected to /login" | Session state expired or not applicable. Playwright storage state carries cookies + localStorage only, not sessionStorage (auth kept only there cannot work with any storage-state tool); it is origin-bound (`localhost` ≠ `127.0.0.1` — compare `origins[].origin` in the file with `--origin`). A "session valid" probe that loads a **public** route proves nothing. Prove it: load a route that requires auth with that state, wait for something only a signed-in page renders, confirm the URL did not move. Login behind a CAPTCHA: sign in by hand in a headed browser and save the state — never automate around it. |
| Capture crashes "Executable doesn't exist" | `pnpm exec playwright install chromium-headless-shell` for the host's Playwright version. |
| Git Bash turns `--exclude /login` into `C:/Program Files/Git/login` | MSYS path conversion — `MSYS_NO_PATHCONV=1`, or put the flag in a package.json script. |
| CI fails on `file:*.tgz` pin | Working as intended — publish and repin exact. |

## Red flags — stop

- About to add a wrapper `<div data-intro>` → make the component forward `...rest`.
- About to tag a caption because the section component swallows props → same.
- About to hand-write `public/intro/*.json` from scratch for many pages → `intro:capture`, then edit.
- About to edit copy on a live intro without bumping `revision`.
- A class-selector target without `"optional": true`.
- Shipping intros with no `lint:intro` in CI — every failure mode is silent at runtime.
- `link:` to the package checkout, or a caret range.

## Staleness

Re-derive the fingerprint from the installed package:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-intro'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

If it is not `72d17c3a9550`, read the installed `README.md` and `dist/index.d.ts` before trusting
the tables above. The fingerprint does not cover the CLI or the JSON schema rules — after a bump,
also run `node_modules/.bin/starterkit-intro --help` and re-run `lint:intro`.
