# Theming SunEditor v3 (light/dark, brand tokens)

v3 paints **every** surface — toolbar, dropdowns, controllers, modals, status
bar, writing area — from `--se-*` custom properties declared on `.sun-editor`
and `.sun-editor-editable` (`suneditor/src/assets/design/color.css`). Theme by
re-pointing those properties at your app's tokens. Do **not** port a v2 sheet
that overrides selectors one by one: half of them were renamed.

## v2 selectors that no longer exist

| v2 | v3 |
|---|---|
| `.se-dialog`, `.se-dialog-back`, `.se-dialog-inner`, `.se-dialog-content` | `.se-modal`, `.se-modal-back`, `.se-modal-inner`, `.se-modal-content` |
| `.se-dialog-header/footer/form` | `.se-modal-header/footer/form` |
| `.se-resizing-bar` | `.se-status-bar` |
| editor `#fff`/`#000` hard-coded per selector | `var(--se-main-background-color)` / `var(--se-main-color)` |

Still present: `.sun-editor`, `.se-toolbar`, `.se-btn`, `.se-btn-primary`,
`.se-wrapper`, `.se-wrapper-wysiwyg`, `.sun-editor-editable`, `.se-menu-list`,
`.se-list-layer`, `.se-controller`, `.se-placeholder`.

## Where things mount

| Element | Parent |
|---|---|
| Toolbar, writing area, status bar | `.sun-editor` next to the (hidden) target |
| Modals, dropdown tray, loading box, drag cursor | `.sun-editor.sun-editor-carrier-wrapper` appended to **`document.body`** |

So a theme scoped under a page or card class (`.wall .sun-editor …`) themes the
editor box and leaves every modal and dropdown on the default light palette.
Keep the token mapping global.

## Token mapping (starterkit-theme names; substitute your own)

```scss
// Repeat the class: suneditor declares the same properties on `.sun-editor`
// (0,1,0); its sheet usually loads after yours, so a tie is a loss.
.sun-editor.sun-editor,
.sun-editor-editable.sun-editor-editable {
  --se-main-font-family: var(--font-body), system-ui, sans-serif;
  --se-content-font-family: var(--font-body), system-ui, sans-serif;
  --se-codeview-font-family: var(--font-mono), ui-monospace, monospace;

  --se-caret-color: var(--fg1);
  --se-placeholder-color: var(--fg-muted);
  --se-edit-font-color: var(--fg1);
  --se-edit-background-color: var(--surface);
  --se-edit-background-pre: var(--surface-elevated);
  --se-edit-border-light: var(--border);
  --se-edit-border-dark: var(--border);
  --se-edit-border-table: var(--border);
  --se-edit-hr-color: var(--border);
  --se-edit-anchor: var(--secondary);
  --se-edit-hover: var(--hover-overlay);

  --se-main-out-color: var(--border);
  --se-main-color: var(--fg1);
  --se-main-font-color: var(--fg1);
  --se-main-background-color: var(--surface);
  --se-main-divider-color: var(--border);
  --se-main-border-color: var(--border);
  --se-statusbar-font-color: var(--fg2);
  --se-code-view-color: var(--fg1);
  --se-code-view-background-color: var(--surface-elevated);

  --se-hover-color: var(--fg1);
  --se-hover-light-color: var(--hover-overlay);
  --se-select-menu-hover-bg: var(--hover-overlay);
  --se-active-light4-color: var(--primary-bg);   // active toolbar button fill
  --se-active-light5-color: var(--primary-bg);
  --se-active-dark3-color: var(--primary-text);  // active toolbar button ink
  --se-active-dark5-color: var(--primary-solid); // modal Submit fill
  --se-active-hover-color: var(--primary-solid-hover);

  --se-dropdown-font-color: var(--fg1);
  --se-controller-background-color: var(--surface-elevated);
  --se-controller-border-color: var(--border);
  --se-controller-color: var(--fg1);
  --se-modal-background-color: var(--surface);
  --se-modal-color: var(--fg1);
  --se-modal-border-color: var(--border);
  --se-modal-anchor-color: var(--secondary);
  --se-table-picker-highlight-color: var(--primary-bg);
}

.sun-editor.sun-editor {
  border-radius: var(--radius);
  &:focus-within { border-color: var(--primary-border); box-shadow: 0 0 0 3px var(--ring); }
  // v3 hard-codes `color: #fff` on the modal Submit, not a variable.
  .se-btn-primary, .se-btn-primary:hover, .se-btn-primary:focus { color: var(--primary-on-solid); }
}
```

The full list of ~130 properties is in `suneditor/src/themes/dark.css` — that
file is the best template, because it sets every one of them.

## Built-in themes instead

`theme: 'dark'` (also `cobalt`, `cream`, `midnight`) adds `.se-theme-dark` to
the editor and the carrier. The theme CSS is **not** in `suneditor/css/editor`;
import it separately: `import 'suneditor/src/themes/dark.css'`. A built-in theme
is a fixed palette — it will not follow a brand preset or a runtime light/dark
toggle unless you also switch the `theme` option (`editor.resetOptions`).

## Verify in the browser, not by reading CSS

Compare computed colours to the token, both schemes:

```js
const probe = document.createElement('div');
probe.style.backgroundColor = 'var(--surface)';
document.body.appendChild(probe);
const surface = getComputedStyle(probe).backgroundColor; probe.remove();
getComputedStyle(document.querySelector('.sun-editor')).backgroundColor === surface;
// .sun-editor-editable is TRANSPARENT over the shell — compare its `color`, not its background.
```
