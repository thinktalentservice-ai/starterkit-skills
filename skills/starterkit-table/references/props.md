# starterkit-table — full prop, toolbar and filter-mode reference

Documented against **0.1.0** (fingerprint `0eab8ad4d284`). Source of truth: the doc comment on
`KitTable` in `src/kit-table.tsx`, `src/filter-modes.ts`, `src/chrome.tsx`.

## Peer dependencies

| Package | Range |
|---|---|
| `react`, `react-dom` | `>=18` |
| `@mui/material` | `>=9.0.0` |
| `@mui/icons-material` | `>=6.0.0` (MRT imports it; the full-screen button uses it) |
| `@mui/x-date-pickers` | `>=9.0.0` |
| `@emotion/react`, `@emotion/styled` | `^11.14.0` |
| `material-react-table` | `^3.2.1` |
| `lucide-react` | `>=1.0.0` (search, clear, pager, empty-state icons) |
| `@devopsnext/starterkit-theme` | `>=1.7.0` |

## `KitTable` props

Any prop not listed goes straight to `useMaterialReactTable`, except `state`, which the kit owns.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `columns` | `MRT_ColumnDef<T>[]` | required | Filter modes are filled in per column (below). |
| `data` | `T[]` | required | |
| `getRowId` | `(row, index) => string` | row index | Use a real id. Safe with nested fields: while loading, index ids are used. |
| `isLoading` | `boolean` | `false` | Skeleton rows; rows emptied; count and pager hidden. |
| `noun` | `string` | `"rows"` | "12 accounts", "No accounts match “x”". |
| `searchPlaceholder` | `string` | `"Search..."` | |
| `searchAriaLabel` | `string` | the placeholder | |
| `toolbar` | `KitToolbarOptions` | see below | Partial object; unlisted keys keep their default. |
| `actions` | `ReactNode` | — | Page-level buttons at the toolbar's right end. |
| `filters` | `ReactNode` | — | After the search box: chips, selects. |
| `bulkActions` | `(rows: T[], clear: () => void) => ReactNode` | — | Turns on row checkboxes and the selection strip. Call `clear()` after success. |
| `rowActions` | `(row: T) => RowActionItem[] \| ReactNode` | — | Last column. Items need a string `label`. |
| `renderLink` | `RenderLink` | plain `<a>` | Router link for items with `to`. |
| `renderDetailPanel` | `(row: T) => ReactNode` | — | Expand chevron per row. Not shown for grouped rows. |
| `initialSort` | `MRT_SortingState` | `[]` | |
| `emptyTitle` | `string` | `"Nothing here yet"` | |
| `emptyHint` | `ReactNode` | — | |
| `emptyIcon` | `ReactNode` | lucide `Inbox` | Ignored while a search is active. |
| `initialState` | MRT initial state | density `comfortable`, page size `pageSizes[0]` | Merged over the kit's defaults. |
| `total` | `number` | `data.length` | Count denominator when `data` is pre-filtered outside the table. |
| `getRowClassName` | `(row: T) => string \| undefined` | — | Per-row class, e.g. a brand scope. |
| `actionsSize` | `number` | `120` | Width of the row-actions column. |
| `actionsHeader` | `string` | `"Actions"` | |
| `searchResetKey` | `unknown` | — | Search clears when this value changes (e.g. a tab id). |
| `sortResetKey` | `unknown` | — | Sorting returns to `initialSort` on change. |
| `selectionResetKey` | `unknown` | — | Selection clears on change. |
| `isRowLocked` | `(row: T) => boolean` | — | Ticked and disabled (done, cannot redo). |
| `enableRowSelection` | MRT option | — | `(row) => boolean` disables one row's checkbox. |
| `pageSizes` | `number[]` | `[10, 25, 50]` | First entry is the default page size. |
| `countAtEnd` | `boolean` | `false` | "Showing X of Y" at the toolbar's right end instead of the live count. |

Selection drops rows no longer in `data` (after a refetch). The header checkbox selects every row that
matches the search, across pages. The pager renders nothing while loading or when there are no rows.

## Toolbar options

```jsx
<KitTable {...props} toolbar={{ search: true, filters: true, columns: true, density: false, fullScreen: false }} />
```

| Option | Control | Default |
|---|---|---|
| `search` | search box | on |
| `filters` | show/hide the per-column filter row | on |
| `columns` | show/hide columns menu | on |
| `density` | comfortable (58 px rows) / compact (42) / spacious (74); `initialState.density` sets the start | off |
| `fullScreen` | table fills the viewport; Esc or the button leaves (Esc closes an open menu first) | off |

## Row actions

```ts
type RowActionItem = {
  label: string;        // also the title and aria-label — icon-only items still need it
  icon?: ReactNode;
  to?: string;          // renders a link (renderLink if given, else <a href>)
  onClick?: () => void; // renders a <button>
  primary?: boolean;    // emphasised item
  showLabel?: boolean;  // text next to the icon
};
```

Clicks on an item do not bubble to the row. `renderLink` receives
`{ href, className, title, "aria-label", onClick, children }` — spread all of it onto the link.

## Filter modes

Applied by `KitTable` through `applyFilterModes`. The first mode is the default the field applies as
you type.

| Column | Modes |
|---|---|
| text (default) | contains, startsWith, endsWith, equals, notEquals, empty, notEmpty |
| ID (`...idFilter`) | contains, startsWith, equals, notEquals; placeholder "Filter" |
| `filterVariant: "select" \| "multi-select" \| "checkbox"` | none — no mode icon |
| `range*`, `date*`, `time*` variants | MRT's own, untouched |
| `enableColumnFilter: false` | untouched |
| `filterFn` is a function | untouched; no mode menu |
| `filterFn` set to a non-text mode (`between`, `fuzzy`…) without `columnFilterModeOptions` | untouched |

Fuzzy is never offered on text columns. A column opts out of the defaults by giving its own
`columnFilterModeOptions` (and a `filterFn` from that list), or `enableColumnFilterModes: false`. A
mode seeded in `initialState.columnFilterFns[id]` wins over the kit's default. Filterable columns with
a `size` below 140 are raised to 140.

## Also exported

`KitDetail` (expanded-row body: `summary`, `items: {key, name, desc?}[]`, `empty`), `SearchInput`
(`value`, `onChange(string)`, `onClear?`; a MUI TextField), `Toolbar`, `ResultCount`, `EmptyState`,
`Pager`, `RowActions`, `useConcreteMuiTheme`, `applyFilterModes`, `idFilter`, `TEXT_MODES`,
`ID_MODES`, and the types `KitTableProps`, `KitToolbarOptions`, `RowActionItem`, `RenderLink`,
`FilterMode`, `SearchInputProps`, `KitMuiTheme`.

`Pager`, `ResultCount`, `RowActions` and `EmptyState` are exported so a non-table page can match the
look; inside a table they are already wired. `Pager` clamps `page` to `[1, pages]`.

## Theme tokens it reads

The table's theme resolves these from `<html>` and logs the missing ones: `--primary`,
`--primary-bg`, `--secondary`, `--success`, `--warning`, `--warning-text`, `--danger`, `--info`,
`--card`, `--surface-elevated`, `--fg1`, `--fg2`, `--border`. `styles.css` and the table's inline
styles additionally use `--primary-channel`, `--fg2-channel`, `--primary-text`, `--primary-border`,
`--primary-solid` and `--fg-muted`. Radii are literals (8, 10, 12 px), not tokens. All tokens come from
`@devopsnext/starterkit-theme`'s preset and base sheets.
