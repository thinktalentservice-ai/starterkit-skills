# Capturing — `captured`, `.bones.json` and the `auto-skeleton` command

Read this before adding a `captured` prop, running `auto-skeleton`, or touching a `.bones.json`.

## Contents

- [When a capture is the right answer](#when-a-capture-is-the-right-answer)
- [What a capture is, and is not](#what-a-capture-is-and-is-not)
- [The command](#the-command)
- [First capture of a new skeleton](#first-capture-of-a-new-skeleton)
- [Pages behind a login](#pages-behind-a-login)
- [Capturing the whole project in one command](#capturing-the-whole-project-in-one-command)
- [Exit codes — what "green" does and does not mean](#exit-codes--what-green-does-and-does-not-mean)
- [Diagnostics](#diagnostics)

## When a capture is the right answer

One case: **the content does not exist until JavaScript has run**, so the exported or
server-rendered HTML has nothing to measure and nothing for the CSS skeleton to restyle. On a slow
connection that is an empty region until the bundle arrives.

- a table whose MUI theme is built from `getComputedStyle`
- a chart
- anything rendered only after a `useEffect`

If the component *can* be rendered with placeholder data, use `fixture` instead. A fixture cannot
go stale; a capture can, and nothing tells you when it has.

## What a capture is, and is not

- **A file you commit and re-run**, not something kept in step automatically. After a layout
  change the old capture is a slightly wrong placeholder until the command runs again. Nothing
  fails. Review its diff like any other change.
- **It stretches.** Horizontal positions are a share of the captured width, so a capture taken in
  a 992px wrapper fills a 1160px one. Circles keep their size. Which capture shows is chosen by
  media query: the widest breakpoint not wider than the viewport.
- **It reserves its height** while the wrapper is otherwise empty, so the page does not jump when
  the real content arrives.
- **It carries no colours.** Frames are redrawn as outlines in the bone colour, so one capture
  serves light and dark themes. `boneColor` applies to it.
- **It costs bytes.** Every breakpoint is inlined into the HTML. A card is a few hundred bytes; a
  dense data table can be tens of kilobytes — lower `--max-height` to capture only what is above
  the fold.
- **It is the last resort in the precedence**, not the first: a live measurement wins, then a shape
  remembered under `name`, then the capture, then the plain block. In practice the capture is what
  a visitor sees on arrival, before hydration; a later load in the same page session shows the
  remembered shape instead, when the wrapper is still the width it was learned at.

The file is one line per breakpoint, so a re-capture diffs per breakpoint:

```json
{
  "name": "orders",
  "breakpoints": {
    "375": {"width":343,"height":700,"bones":[…]},
    "768": {…},
    "1280": {…}
  }
}
```

Never edit it by hand. The next capture overwrites it.

## The command

Installed with the package. Run it as `pnpm auto-skeleton`, `npx auto-skeleton` or
`yarn auto-skeleton`.

```
auto-skeleton --url <url> [--url <url> …] [options]

  --url <url>            Page to capture. Repeat for several pages.
  --out <dir>            Where to write <name>.bones.json   (default: src/skeletons)
  --breakpoints <list>   Viewport widths, comma separated   (default: 375,768,1280)
  --name <name>          Only capture this skeleton. Repeat for several.
  --wait <ms>            Extra time to wait after load      (default: 1000)
  --max-height <px>      Capture no further down than this  (default: 1200)
  --color-scheme <s>     light | dark | no-preference
  --storage-state <file> Playwright storage state, for pages behind a login
```

It opens each URL at each viewport width, finds every `<AutoSkeleton name="…">` that has finished
loading, measures it with the same extractor the component uses, and writes `<name>.bones.json`.

Requirements, each of which fails with a message rather than silently:

- **Playwright in the host project** — `playwright` or `@playwright/test`. The package does not
  depend on it. `pnpm add -D playwright`, then `pnpm exec playwright install chromium` once.
- **The app running**, at the URL you pass. Include the base path and, where the app uses them,
  the trailing slash.
- **Each wrapper has a `name`** and is **showing its real content** (`loading` false) when the page
  settles. One still loading is reported, not skipped.
- **The `name` is a safe file name** — letters, digits, `.`, `-`, `_`, not starting with a dot. It
  is read out of the page being captured and becomes a path, so anything else is refused and the
  command exits non-zero.

Entrance animations are waited for: a bone is measured where its element comes to rest.

## First capture of a new skeleton

The file has to exist before the page can import it, so the order is:

1. Wrap the content, with a literal `name` and **no** `captured` yet:
   ```jsx
   <AutoSkeleton loading={!ready} name="orders">
     {ready ? <OrdersTable /> : null}
   </AutoSkeleton>
   ```
2. With the app running, capture it from the page that shows it:
   ```bash
   pnpm auto-skeleton --name orders --url http://localhost:3000/<base-path>/<route>/
   ```
3. Import the file and pass it:
   ```jsx
   import ordersBones from "@/skeletons/orders.bones.json";

   <AutoSkeleton loading={!ready} name="orders" captured={ordersBones}>
   ```
4. Load the page with JavaScript throttled or disabled and look at it. That is the only state in
   which the capture is what is on screen.
5. Commit the `.bones.json` with the change that needs it.

## Pages behind a login

A wrapper on a signed-in page stays `loading` for an anonymous browser, so nothing is captured.
Sign in once with Playwright, save the storage state, and hand it over:

```bash
pnpm auto-skeleton --url <url> --storage-state <state-file.json>
```

Keep that file out of git — it is a session. If the host already has a script that signs in and
saves one (the Think Talent template has `pnpm debug:login --close`, writing
`.playwright-mcp/debug-session.json`), use it rather than writing another.

## Capturing the whole project in one command

`auto-skeleton` captures the URLs it is given. In a project with more than one captured skeleton
that becomes a list of URLs in `package.json` that someone has to remember to extend — and a page
left off it keeps importing a file that is never refreshed.

**Check first whether the host already solved this.** If `package.json` has a `skeleton:capture`
script, use it and do not call `auto-skeleton` directly:

```bash
pnpm skeleton:list       # what will be captured, and from which URL; opens no browser
pnpm skeleton:capture    # every <AutoSkeleton captured> in the project
```

If it does not, set it up — the numbered procedure is in `SKILL.md` under *Project-wide capture*.
In short, from the project root:

```bash
node <skill-dir>/scripts/setup-capture.mjs --dry-run   # then again without the flag
```

`setup-capture.mjs` copies `skeleton-capture.mjs` into the host's `scripts/`, adds
`skeleton:capture` and `skeleton:list` to `package.json`, and reports the dev dependencies the
host lacks. It is idempotent, installs nothing, and refuses — until re-run with `--force` — to
overwrite a `skeleton:capture` that says something else or a copied script that has been edited.
A line that already runs `scripts/skeleton-capture.mjs` through a wrapper (an env loader, say) is
left alone.

What `skeleton-capture.mjs` does:

- reads the source for every `<AutoSkeleton>` with a `captured` prop — those are the skeletons
  that need a file; one with only a `name` is measured at runtime and is listed, not captured;
- derives each one's URL from the Next.js App Router page file it sits in (route groups and
  parallel slots are dropped from the path);
- passes them all to `auto-skeleton`, each named explicitly, forwarding any other flag unchanged;
- **exits 1 if any expected file was not rewritten** — see the next section for why that matters.

It refuses, naming the file, what it cannot work out: a `captured` wrapper with no literal `name`,
two wrappers sharing a name, a wrapper in a shared component rather than a page file, or a page
under a `[dynamic]` segment. For the last two, pass the page explicitly with `--url`.

It reads from the project rather than asking: the source tree (`src/` when there is a `src/app`,
otherwise `app/`), the base path (`NEXT_PUBLIC_BASE_PATH` from the environment, else from
`.env.local` / `.env.development` / `.env`; `--base-path` overrides), and `trailingSlash` from
`next.config.*`. It assumes a Next.js App Router tree and a dev server on `http://localhost:3000`
(`--origin`, or `SKELETON_ORIGIN`). For another router, `routeOf` is the one function to rewrite.
It finds the JSX tag literally named `AutoSkeleton` — an aliased import is not detected.

Its defaults are `--out src/skeletons --max-height 700`, in the `DEFAULTS` constant at the top. A
project whose captures were taken with other flags must carry them there, or the next run rewrites
every file at the new settings.

## Exit codes — what "green" does and does not mean

`auto-skeleton` exits non-zero when **nothing** was captured, or when a name was refused as
unsafe. It exits **0 when at least one skeleton was written** — even if another on the same run
was still loading. That one is reported on stderr and left as it was.

So in a multi-page run, a page that needed a login or a longer `--wait` drops out of a run that
looks successful. Read the output, not the exit code — or use the project-wide script above, which
checks every expected file was actually rewritten.

## Diagnostics

| Symptom | Cause | Fix |
|---|---|---|
| `✖ "x" was still loading when the page settled` | `loading` was still true: not signed in, a slow request, or content that never arrives | `--storage-state`, a longer `--wait`, or fix the page |
| `✖ Nothing captured. Is there an <AutoSkeleton name="…"> on the page…` | no named wrapper at that URL, a wrong base path, or `--name` matched nothing | open the URL yourself; check `name` |
| `auto-skeleton: Playwright is not installed here` | Playwright is not a dependency of the host | `pnpm add -D playwright` |
| Playwright reports a missing browser executable | the browser binary was never downloaded | `pnpm exec playwright install chromium` |
| `✖ "…" is not a safe file name` | the `name` has a slash, a space or a leading dot | rename the wrapper |
| `env: 'node\r': No such file or directory` | the package is pinned at 0.1.0 | install 0.2.0 or later |
| The capture shows, then the layout jumps | the capture is older than the layout | re-capture and commit |
| The capture is cut off partway down | `--max-height` (default 1200; a host script may lower it) | raise it, knowing every row costs bytes in the HTML |
| The captured skeleton never appears | the content had something to measure or restyle, so that won — a capture only shows when there is nothing else | expected; if the content can be measured, drop `captured` and its file |
| A wrapper has `captured` but the command never refreshes its file | no `name`, so the command cannot find it; the stale capture still renders | add a literal `name` matching the file |
| The file changes on every run with no layout change | the page had not settled — data or fonts still arriving | a longer `--wait` |
