---
name: starterkit-css-imports
description: Use when deciding where a global stylesheet is imported in a Next.js app built on the @devopsnext starter kit — whether a .css or .scss file belongs in app/layout.jsx (or pages/_app), in style.scss, or in globals.css; when adding a vendor stylesheet (Font Awesome, simplebar, an icon font, a date picker, a package's styles.css); when reorganising, cleaning up or auditing CSS/SCSS imports; when adding a lint gate for import order; and when diagnosing symptoms like a vendor rule that loses to Bootstrap even though it is imported after it, styles that change when a file is moved into a component, an @import in globals.css that does nothing, Bootstrap's --bs-* colours ignoring the theme bridge, the theme preset's tokens being overridden, or "@import must precede all other statements".
license: MIT
compatibility: Next.js 13+ (App Router or Pages Router, Turbopack or webpack) with Dart Sass (`sass` or `sass-embedded`); Tailwind v4 optional. The bundled checker is plain Node 18+ with no dependencies. Commands are shown for pnpm; npm and yarn work the same way.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-css-imports

Three files share the job of loading global CSS, and each one does exactly one part of it:

| File | Holds | Never holds |
|---|---|---|
| `src/app/layout.jsx` (or `pages/_app.*`) | **The one ordered list** of every global stylesheet: theme preset, package sheets, app token overrides, vendor `.css`, then the `.scss` entry, the Bootstrap bridge, `globals.css` | Sass partials one by one |
| `src/styles/style.scss` | **Sass only**: Bootstrap config → Bootstrap → `bootstrap-icons` → the app's own `.scss` partials | Any `@import` of a `.css` file, a URL, or `url()` |
| `src/styles/globals.css` | **Tailwind and app-wide rules**: `@import "tailwindcss/…"`, `@source`, `@theme`, then the app's global rules | Vendor or package stylesheets |

The rule underneath all three: **the entry's import list is the only place where the written order is the loaded order.** Each section below is a way the other two files break that.

## Why: four mechanisms, each verified

**1. Sass hoists plain-CSS `@import` above everything.** Sass inlines `@import 'partial'`. But `@import 'x.css'`, an `http(s)://` URL, `url(…)` or anything carrying a media query is a *plain CSS* import. Sass writes it out as a CSS `@import`, and CSS only allows `@import` at the top of a file, so Sass moves it there. Compiled with `sass-embedded`:

```scss
.before { color: red }
@import "vendor.css";       // written AFTER .before
.after  { color: blue }
```
```css
@import "vendor.css";       /* emitted FIRST */
.before { color: red; }
.after  { color: blue; }
```

A vendor sheet written at the bottom of `style.scss` therefore loads **before Bootstrap**, not after it. If it was meant to override Bootstrap, it silently loses. The file reads one way and runs the other.

**2. Next keeps CSS in import order within one module, and only there.** Order across modules (a component that imports a global sheet, a nested layout) depends on how chunks are built. A sheet that works in the root layout can change the cascade once it is moved into a component, with no error.

**3. Sass variables only cross files inside one Sass compile.** Every `.scss` imported from JavaScript is a separate compile. `_bootstrap-config.scss` sets `$primary` and friends, and Bootstrap must be in the same compile to see them. Import them separately from the layout and Bootstrap builds with its defaults. That is why the `.scss` partials stay inside `style.scss` instead of joining the layout's list.

**4. Tailwind directives only work in a CSS file, and a CSS `@import` must come first.** `@source`, `@theme` and `@import … layer()` cannot be JavaScript imports, so `globals.css` has to exist. A vendor `@import` inside it runs through the Tailwind pipeline and lands at the top of that file, out of sight of the layout's list. An `@import` that comes after any rule is invalid CSS and gets dropped or rejected.

## The canonical entry order

Include only the packages the app actually installs, and keep the relative order:

```js
import "@devopsnext/starterkit-theme/presets/<preset>.css";      // 1 every token; MUST precede local sheets
import "@devopsnext/starterkit-button-component/styles.css";     // 2 package sheets (read tokens via var())
import "@devopsnext/starterkit-card-component/styles.css";
import "@devopsnext/starterkit-layout/styles.css";
import "@devopsnext/starterkit-theme/styles.css";
import "@/styles/colors_and_type.css";                           // 3 the app's token overrides
import "@fortawesome/fontawesome-free/css/all.min.css";          // 4 vendor .css
import "simplebar-react/dist/simplebar.min.css";
import "@/styles/style.scss";                                    // 5 Bootstrap + Sass partials
import "@devopsnext/starterkit-theme/bootstrap-bridge.css";      // 6 repoints --bs-*; MUST follow Bootstrap
import "@/styles/globals.css";                                   // 7 Tailwind + app globals, last
```

Both **must**s are about duplicate declarations on `:root`, where the later one wins at equal specificity. `var()` itself resolves at computed time, so order never matters for *reading* a token:

- The preset declares every `--token`, and `colors_and_type.css` re-declares the few the app overrides. Put the app sheet above the preset and its overrides silently lose. Package sheets declare nothing on `:root` (they read tokens through `var(--x, <fallback>)`), so their position relative to the preset is harmless. Keeping the preset first is still the convention, because token gates assume it.
- The bridge re-declares `--bs-*`, which Bootstrap also declares on `:root`. Put the bridge before the `.scss` that compiles Bootstrap and Bootstrap's own values win.

## Procedure: audit and fix an app

Run everything from the app root. `<skill-dir>` is wherever this skill is installed.

1. **Check.** The command exits 1 on errors and prints `file:line` for each finding:
   ```bash
   node <skill-dir>/scripts/check-css-imports.mjs
   ```
   It finds the entry automatically. Pass `--entry src/app/layout.tsx` if detection fails, and pass `--load-path src/styles` for every Sass load path set in `next.config` (`sassOptions.loadPaths` / `includePaths`), otherwise partials under those paths are not walked.

2. **Fix the hoisted Sass imports.**
   ```bash
   node <skill-dir>/scripts/check-css-imports.mjs --fix
   ```
   For each plain-CSS `@import` in Sass, `--fix` deletes it from the `.scss` and adds a JS import in the entry **immediately before the `.scss` import that pulled it in**. That is where Sass was already loading it, so **the cascade does not change**. The fix only makes the source honest. Do not "correct" the position to after the `.scss` because the old source read that way: that *is* a cascade change, and it needs its own visual check.

3. **Handle what `--fix` leaves as `manual`.**
   - A remote URL: self-host it (an npm package or `public/`) and import it from the entry. A CDN stylesheet also needs a CSP `style-src` entry. Starter-kit apps keep the CSP free of CDNs on purpose.
   - A media-queried import: a JS import cannot carry a media query. Put the rules inside `@media` in a `.css` file and import that file.

4. **Re-read the edited `.scss` files.** `--fix` removes import lines but leaves the comments that described them. Delete those, and add a comment saying the file is Sass-only and why, so the next person does not add the import back.

5. **Deal with the warnings.** These are conventions, not proven bugs, so they never fail the run:
   - `@import` of a vendor sheet in `globals.css`: move it to the entry, directly before the `globals.css` import (a CSS `@import` lands at the top of its own file, so that is its current position). Use `--allow <substring>` to keep one deliberately.
   - A global stylesheet imported from a component: move it to the entry, or make it a `.module.css`.
   - `globals.css` not last: usually a mistake, but confirm before moving it.

6. **Verify in the browser.** Code review is not enough here. On a page that uses the moved sheets, run this in the console and confirm the rule indices rise in the intended order:
   ```js
   const find = (re) => { const s=[...document.styleSheets]; for (let i=0;i<s.length;i++){ let r; try{r=s[i].cssRules}catch{continue}
     for (let j=0;j<r.length;j++) if (re.test(r[j].cssText)) return `${i}:${j}`; } return null; };
   ({ vendor: find(/\.simplebar-wrapper/), bootstrap: find(/^\.btn\s*\{/) })   // vendor index < bootstrap index
   ```
   For an icon font, also run `await document.fonts.load('24px "<Family>"')` and check that its status is `loaded`. A `url()` that broke during the move shows up only here, as missing glyphs with no console error.

7. **Wire the gate** so the rule survives the next person:
   ```bash
   cp <skill-dir>/scripts/check-css-imports.mjs scripts/
   npm pkg set scripts.lint:css-imports="node scripts/check-css-imports.mjs"
   ```
   Then add `pnpm lint:css-imports` to `prebuild`, or to whatever gate list the app already runs. The script is self-contained. Copy it rather than linking to the skill's copy, so a skill update cannot change the app's CI without a diff.

## What not to do

- **Do not move Sass partials into the layout** "so every import is in one place". It splits one Sass compile into several, and the partials lose the shared `$variables` (mechanism 3).
- **Do not route vendor CSS through `globals.css`** "so all CSS lives in one CSS file". The bridge has to follow Bootstrap, so `globals.css` has to come after `style.scss`. Every package sheet would then move after Bootstrap: a cascade change on every route that no token gate detects.
- **Do not replace a hoisted `@import 'x.css'` with `@use 'x'`** as a shortcut. `@use` must be the first statement in its file, so it cannot sit after Bootstrap either. It also leaves a vendor sheet inside the Sass compile, out of sight of the entry's list, and the next `.css` import added beside it will hoist again.
- **Do not trust a build that passes.** Every mechanism above fails at HTTP 200 with a green build. The only signals are the checker and the browser.

## Diagnosis

| Symptom | Cause | Fix |
|---|---|---|
| A vendor rule loses to Bootstrap even though it is "after" Bootstrap in `style.scss` | Mechanism 1: hoisted above Bootstrap | `--fix`, then move it after `style.scss` deliberately and verify |
| Styles change when a stylesheet import moves into a component | Mechanism 2: order across modules | Import it from the entry |
| Bootstrap ignores `$primary` and friends from the config partial | Config and Bootstrap compiled separately | Keep both inside the one `.scss` entry |
| An `@import` in a `.css` file has no effect, or the build warns that `@import` must precede other statements | `@import` after a rule | Move it to the top, or better, to the entry |
| `--bs-*` colours ignore the theme | Bridge imported before the `.scss` that compiles Bootstrap | Bridge after `style.scss` |
| The app's own token overrides do nothing | `colors_and_type.css` (or another local sheet) imported above the preset | Preset first, in the entry only |
| Tokens resolve to package fallbacks | The preset is not imported at all, or is imported from a module that does not load on this route | Import the preset from the entry |
| Icon glyphs are blank after a move | A relative `url()` in the moved sheet no longer resolves | Import the sheet by a path that keeps its font folder beside it; check `document.fonts` |

## Blind spots of the checker

It reports these on every run rather than hiding them:

- Imports built at runtime (`import()` with a variable, `require` of a computed path) are invisible.
- Sass load paths are walked only when passed with `--load-path`.
- Comments are stripped with a small tokenizer, not a parser: commented-out imports are ignored correctly, but exotic syntax (a regex literal containing a quote character) could confuse it.
- It does not read `node_modules` stylesheets. A package that itself `@import`s a CSS file is outside its reach.
