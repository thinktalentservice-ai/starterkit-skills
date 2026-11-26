---
name: starterkit-table
description: Use when adding, restyling, reviewing or migrating any data table, grid, list-with-search, filterable or selectable table, or row-action column in a React or Next.js app that uses @devopsnext/starterkit-table or material-react-table (MRT) — whenever a `<KitTable>` prop, `toolbar` option, column filter mode, `idFilter`, `rowActions`, `bulkActions` or `renderLink` is being written, when installing or pinning the package, when a hand-rolled MRT config is about to be copied from another page, and when diagnosing symptoms like a table that renders blank or as a placeholder, a console error naming unresolved `--card`/`--fg1` theme tokens, a filter menu offering "Between" or "Fuzzy" on a text column, row-action links that reload the page or drop the basePath, a pager reading "31–25 of 25", an unstyled table because `styles.css` was not imported, or a table that sticks on its loading skeletons.
license: MIT
compatibility: React 18+ (19 tested), ESM or CJS, Next.js App Router or Pages. Needs @devopsnext/starterkit-theme >= 1.7.0 and material-react-table ^3.2.1 on MUI >= 9. Install commands are shown for pnpm.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-table

`@devopsnext/starterkit-table` is the Think Talent page-kit data table: material-react-table (MRT)
with the kit's toolbar, per-column filters, selection strip, row actions, detail rows, pager and
empty state already decided. **You configure data and columns; you do not configure MRT.**

> Every colour comes from a `@devopsnext/starterkit-theme` token (radii are literals) and every
> class is `skt-*`. A page
> that restyles the table, or re-implements its toolbar, pager or filters, is rebuilding what this
> package already owns — and it will drift from every other table in the product.

## Documented against

| | |
|---|---|
| Package version | **0.1.0** — npm `latest` on 2026-11-26, published 2026-11-25T18:55:04Z |
| Type-surface fingerprint | `0eab8ad4d284` — sha256 of `dist/index.d.ts`, first 12 hex ([command](#staleness--how-to-re-derive)) |
| Source | <https://github.com/thinktalentservice-ai/starterkit-table> |
| npm | <https://www.npmjs.com/package/@devopsnext/starterkit-table> |

The prop, toolbar and filter-mode tables are derived from `src/kit-table.tsx`, `src/filter-modes.ts`,
`src/chrome.tsx` and `styles.css` — authoritative for 0.1.0. *Anti-patterns* and *Choosing* are
judgement. If the installed version has moved, see [Staleness](#staleness--how-to-re-derive) first.

## Install — look up latest, pin that exact number

**Two steps, never one.** Ask the registry, then install the literal number it printed:

```bash
pnpm view @devopsnext/starterkit-table version
pnpm add @devopsnext/starterkit-table@<version-from-step-1> --save-exact
```

`package.json` must hold the bare number (`"0.1.0"`). **Open it and check** — no `^`, no `~`, never a
`file:` path. A caret lets a later release change every table in the app with no diff; a `file:`
tarball breaks every other machine and CI.

**A package published less than a day ago** is refused by a repo that sets `minimumReleaseAge` in
`pnpm-workspace.yaml`. Do not lower the age or disable the gate: add one exact line to
`minimumReleaseAgeExclude`, `'@devopsnext/starterkit-table@<version>' # published <ISO8601>`, and
delete it once 24 h (1440 min) have passed. Read the existing entries and any `check-release-age`
script first — it may require the `# published <ISO8601>` marker. Get the timestamp with
`pnpm view @devopsnext/starterkit-table time --json` and read the version's key from the object; never
ask for one key with a dotted path (`time.0.1.2`): the client splits on dots and prints nothing.

Install the peers once in the host, one copy each: `react`, `react-dom`, `@mui/material`,
`@mui/icons-material`, `@mui/x-date-pickers`, `@emotion/react`, `@emotion/styled`, `lucide-react`,
`material-react-table`, `@devopsnext/starterkit-theme`. A duplicate MUI or emotion copy is the usual
cause of "theme is undefined" or unstyled tables. Exact ranges: `references/props.md`.

## Wire once, at the app root

```jsx
// root layout / _app — theme first, table last, after Bootstrap and your global SCSS
import "@devopsnext/starterkit-theme/presets/think.css"; // the tokens
import "@devopsnext/starterkit-theme/styles.css";
import "@devopsnext/starterkit-table/styles.css";
```

Never import `styles.css` from a component. Order matters: the table's rules are unlayered and must
come **after** Bootstrap/global CSS to win ties. Colour scheme goes on `<html>`
(`data-mui-color-scheme`); the table rebuilds its theme when that attribute changes.

The table paints from tokens, so the **preset sheet must be loaded**. If it is not, `KitTable`
renders an empty `.skt-placeholder` and logs once:
`[starterkit-table] theme tokens unresolved, table theme not built: --card, --fg1, …`. That message
is the diagnosis — load the preset; do not hardcode colours to make it go away. Check a token
resolves with `getComputedStyle(document.documentElement).getPropertyValue("--card")` in devtools; an
empty string means the sheet that defines it is not loaded (or a different brand preset than the app's
is — import the preset your app actually uses; `think.css` is the System Owner one).

## Use

```jsx
import { KitTable, idFilter } from "@devopsnext/starterkit-table";

const columns = [
  { accessorKey: "id", header: "ID", size: 110, ...idFilter },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status", filterVariant: "select",
    filterSelectOptions: ["Active", "Archived"] },
];

<KitTable
  columns={columns}
  data={rows}
  getRowId={(r) => String(r.id)}
  noun="accounts"
  isLoading={isPending}
  rowActions={(r) => [{ label: "Open", to: `/accounts/${r.id}`, showLabel: true }]}
  renderLink={({ href, children, ...rest }) => <Link href={href} {...rest}>{children}</Link>}
/>
```

`KitTable` is a client component (`"use client"` survives the build). A server file can render it only
with serialisable props. `rowActions`, `bulkActions`, `renderLink`, `renderDetailPanel` and any
`filterFn` are functions, so a page that passes them must itself start with `"use client"` (or hand
them off to a client wrapper). Buttons inside `bulkActions` / `actions` follow `starterkit-button`.

**Bind `renderLink` once.** In a Next.js app, make one shim that binds `next/link`, and import the
table only through it, so no page repeats the link and the router lives in one file:

```jsx
// src/components/common/kit-table.jsx
import Link from "next/link";
import { KitTable as LibKitTable } from "@devopsnext/starterkit-table";

const renderLink = ({ href, children, ...rest }) => (
  <Link href={href} {...rest}>{children}</Link>
);
export default function KitTable(props) {
  return <LibKitTable renderLink={renderLink} {...props} />;
}
export { KitDetail, idFilter } from "@devopsnext/starterkit-table";
```

Pass `...rest` through: it carries the `onClick` that stops the row click from firing as well. Without
`renderLink`, `to` items render a plain `<a href>` — under a Next `basePath` that **drops the
prefix and reloads the page**. With the `next/link` shim, write `to` **without** the basePath
(`/users/7`, not `/portal/users/7`): `next/link` adds it.

A whole page, shim in place — selection, row actions, trimmed toolbar:

```jsx
"use client"; // function props below
import KitTable, { idFilter } from "@/components/common/kit-table";
import { Eye } from "lucide-react";

export default function UsersPage() {
  const { rows, isPending } = useUsers();
  return (
    <KitTable
      columns={columns}               // as above; role uses filterVariant: "select"
      data={rows}
      getRowId={(r) => String(r.id)}
      noun="users"
      isLoading={isPending}
      toolbar={{ density: true, filters: false }}   // search + columns stay on by default
      rowActions={(r) => [
        { label: "Open", icon: <Eye size={15} />, to: `/users/${r.id}` },
        { label: "Deactivate", onClick: () => deactivate(r.id), showLabel: true },
      ]}
      bulkActions={(sel, clear) => (
        <button type="button" onClick={async () => { await exportUsers(sel); clear(); }}>Export</button>
      )}
    />
  );
}
```

Row-action icons are `lucide-react` (the set the table itself uses); an item with no `showLabel` is
icon-only, so give it a clear `label` — that becomes its title and aria-label.

## Choosing

| Need | Write |
|---|---|
| Plain list with search and a pager | `columns`, `data`, `getRowId`, `noun` |
| Per-column filter | leave it on — it is the default; set `enableColumnFilter: false` on a column to drop it |
| ID column | `{ accessorKey: "id", ...idFilter }` — contains / startsWith / equals / notEquals only |
| Closed list column | `filterVariant: "select"` + `filterSelectOptions` — no mode icon, by design |
| Hide a toolbar control | `toolbar={{ search: false }}`; unlisted keys keep their default |
| Density or full-screen | `toolbar={{ density: true, fullScreen: true }}` — both off by default |
| Row opens a page | `rowActions` item with `to` |
| Row runs code | `rowActions` item with `onClick` |
| Several rows at once | `bulkActions(rows, clear)` — turns on checkboxes and the selection strip |
| Expandable row | `renderDetailPanel(row)`, body from `<KitDetail>` |
| Filter chips above the table | `filters={<…/>}` — renders after the search box |
| Count must ignore an outside filter | `total={unfilteredCount}` |
| Reset search / sort / selection when a tab changes | `searchResetKey` / `sortResetKey` / `selectionResetKey` |
| A row that is done and cannot be re-picked | `isRowLocked(row)` (ticked, disabled) |

Every prop, with defaults and the toolbar and filter-mode tables: `references/props.md`.

## Rules the table relies on

1. **Tokens, not literals.** Style around the table with `var(--primary)`, `var(--fg1)`, `var(--border)`.
   A hex written next to it is invisible to a brand or scheme switch.
2. **One theme under it.** The table builds its own scoped MUI theme with concrete colours (MRT runs
   colour maths that throws on `var(--x)` palettes). Do not wrap it in a second `ThemeProvider` to
   "fix" a colour — change the token.
3. **`getRowId` is the row's identity.** Selection survives a refetch only for ids still present.
   Return a string that is unique and stable; never the array index.
4. **`isLoading` is a prop, not a state you fake.** It empties the rows, shows skeletons and hides the
   count and pager. `data={[]}` while loading shows "Nothing here yet" instead.
5. **`filterFn` that is a function is yours.** The column keeps your function and gets no mode menu.
6. **Pass `initialState`, never `state`** — the kit owns `state` (search, sort, selection, loading).
   `initialState.density`, `.pagination`, `.columnFilterFns` are honoured.
7. **`rowActions` returns items or a node.** An array counts as items only if *every* entry has a
   string `label`; `[<A/>, <B/>]` renders as nodes.

## Anti-patterns

| Don't | Why | Do |
|---|---|---|
| Copy an MRT config (`muiTableHeadCellProps`, `renderTopToolbar`, own pager) into a page | Forks the look; the next kit change skips that page | `KitTable` + columns; override one MRT option by passing it through |
| `import "…/styles.css"` inside a component | Loads per mount, wrong cascade position | once, at the root |
| `^0.1.0` or `file:../x.tgz` in `package.json` | Silent drift / unbuildable elsewhere | bare exact version |
| Plain `<a>` row links under a Next `basePath` | Drops the prefix, full reload | bind `renderLink` to `next/link` |
| Overriding `.skt-*` or `.MuiTable*` in app CSS | Package-owned selectors; rename upstream breaks you | tokens, or a prop |
| Offering "Between" / "Fuzzy" on a text column | Meaningless modes; the kit removes them | leave `columnFilterModeOptions` unset |
| A local `SearchInput`, `Pager` or `EmptyState` | Already exported | `import { SearchInput } from "@devopsnext/starterkit-table"` |
| `getRowId={(_, i) => i}` | Selection and bulk actions act on the wrong rows after a sort/refetch | a real id |
| Reading the MRT `table` in your own wrapper with React Compiler on | The instance is one mutable object; derived values freeze (stuck skeletons) | add `"use no memo"` to that component |
| Silencing the `MenuListProps` warning | It is MRT 3.2.1 vs MUI 9 | see Known issues — leave it |

## Known issues

- Opening a column filter menu logs `React does not recognize the MenuListProps prop` **in
  development only**. MRT 3.2.1 passes a prop MUI 9 removed; it cannot be overridden from outside.
  Harmless at runtime; goes away with an MRT release.
- Filterable columns are raised to a 140 px minimum width so the mode icon does not cut the placeholder.
- Classes are `skt-` prefixed. The one host class it styles is `pk-cell-muted` inside a cell (two-line
  clamp), kept by name.

## Staleness — how to re-derive

This file documents 0.1.0. Compare what the registry publishes, what `package.json` pins, and what is
installed:

```bash
pnpm view @devopsnext/starterkit-table version
pnpm ls @devopsnext/starterkit-table
```

Fingerprint of the installed type surface (first 12 hex of sha256 of `dist/index.d.ts`) — should print
`0eab8ad4d284`:

```bash
node -e "const c=require('crypto'),f=require('fs'),p=require('path');const d=p.dirname(require.resolve('@devopsnext/starterkit-table'));console.log(c.createHash('sha256').update(f.readFileSync(p.join(d,'index.d.ts'))).digest('hex').slice(0,12))"
```

**Do not "simplify" it to `require('@devopsnext/starterkit-table/package.json')`.** `exports` declares
only `.` and `./styles.css`; any other subpath throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Resolve the main
entry and walk to its sibling instead.

If the fingerprint moved, read before trusting a table, in this order: `dist/index.d.ts` (prop types),
`styles.css` (comments carry the reasoning), `README.md`, then the source repo's `src/kit-table.tsx`
doc comment.

## Red flags — stop

- About to paste an MRT `useMaterialReactTable` config into a page → use `KitTable`.
- About to write `pnpm add …@latest` or `@^0` → look up the number, then pin it.
- `package.json` shows `^0.1.0` or `file:` → re-add with `--save-exact` from the registry.
- A hex or `rgb()` next to the table to fix its colour → rule 1; the token is missing or wrong.
- Console says `theme tokens unresolved` → the theme preset sheet is not loaded; fix the import.
- A row link reloads the page or 404s under a `basePath` → `renderLink` is not bound to the router link.
- About to set `getRowId` to the array index → rule 3.
- About to restyle `.skt-*` or `.MuiTableCell-root` in app CSS → tokens or a prop instead.
- A column offers "Between" or "Fuzzy" on text → someone passed `columnFilterModeOptions` or a custom
  `filterFn`; remove it unless the column really is numeric.
- About to publish or pin a version that is newer than what you read here → re-run Staleness first.
