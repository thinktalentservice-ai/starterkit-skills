---
name: suneditor-v3
description: Use when adding, upgrading, configuring, theming or debugging the SunEditor rich-text (WYSIWYG) editor at v3 (`suneditor` 3.x) in a React or Next.js app — migrating from suneditor 2.x or the `suneditor-react` wrapper, translating v2 options such as `setOptions`, `attributesWhitelist`, `imageFileInput`, `videoIframeAttrs`, `resizingBar`, `defaultStyle`, `linkProtocol` or `popupDisplay`, choosing `buttonList` names or `plugins`, or diagnosing "getContents is not a function", `Cannot find module 'suneditor/dist/css/suneditor.min.css'`, `[SUNEDITOR.plugins.exportPDF.error]` / math / template / layout console warnings, a white editor on a dark theme, `.se-dialog` styles that stopped applying, a caret that jumps to the top on every keystroke, two toolbars in dev, or an image/video/link modal whose URL field will not take typing inside an MUI Dialog.
license: MIT
compatibility: Verified against suneditor 3.4.1 with Next.js 16 / React 19 (App Router, StrictMode). The option table also covers 3.4.x docs.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# suneditor-v3

SunEditor v3 is a rewrite, not a version bump. The core is the same idea, but
the options, toolbar button names, events, imperative API, CSS entry points,
class names and DOM placement all changed — and **most v2 mistakes fail
silently**: an unknown option is ignored, a misspelt whitelist allows nothing
(or everything), and a mis-scoped theme leaves only the modals white.

**Core principle:** trust the shipped source over memory. Every claim below was
checked in `node_modules/suneditor/src` (3.4.1). When something here disagrees
with what you remember about v2, this file wins; when it disagrees with the
installed version's source, the source wins — grep `src/core/schema/options.js`.

## The failures that look like success

| Symptom | Cause | Counter |
|---|---|---|
| `Cannot find module 'suneditor/dist/css/suneditor.min.css'` (or `dist/suneditor.min.css`) | v3's `exports` map only exposes `suneditor/css/editor` and `suneditor/css/contents`. | `import 'suneditor/css/editor'` |
| Editor renders, every toolbar dropdown/modal button does nothing | No `plugins` passed — v3 plugins are opt-in. | pass `plugins` (see Plugins) |
| `[SUNEDITOR.plugins.exportPDF.error]`, math/template/layout/fileUpload warnings on every mount; a stray gallery request | Whole `plugins` export passed. | pass only the toolbar's plugins |
| `suneditor-react` installed, nothing works / v2 errors | `suneditor-react` 3.x drives the **v2** API. | remove it; mount directly (references/react-mount.md) |
| Button missing from toolbar, no error | v2 button name: `hiliteColor`, `horizontalRule`, `formatBlock`. | `backgroundColor`, `hr`, `blockStyle` |
| Option has no effect, no error | v2 option name (`imageFileInput`, `videoIframeAttrs`, `resizingBar`, `defaultStyle`, …). Unknown keys are ignored. | references/options-v2-to-v3.md |
| `attributeWhitelist` allows nothing extra | Space-separated list. Lists are `|`-delimited regex. | `'src|style|width'` |
| `attributeWhitelist: { all: '*' }` does nothing | All-tags key is `'*'`; `all` is read as a tag `<all>`. | `'*'` — and think before `'*': '*'` |
| Caret jumps to the start on each keystroke | Live state fed back into the editor (`value`/`$.html.set` on every change). | seed once; remount with `key` to reset |
| Two toolbars in dev; an orphan `.sun-editor-carrier-wrapper` on `<body>` | StrictMode double effect without a cancel guard, or no `destroy()`. | `cancelled` flag + `editor.destroy()` |
| `NotFoundError: Failed to execute 'removeChild'` on re-render | React owns the target node; v3 hides it and inserts siblings. | create the target imperatively in an empty div |
| Editor box themed, **modals and dropdowns still white** | Theme scoped under a page/card class; v3 mounts modals on `document.body`. | global `--se-*` mapping (references/theming.md) |
| `.se-dialog-*` / `.se-resizing-bar` styles stopped applying | Renamed: `.se-modal-*`, `.se-status-bar`. | migrate to `--se-*` variables |
| Inside an MUI `Dialog`, the image/video/link modal's URL field takes no keystrokes | Modal lives on `document.body`, outside the Dialog; MUI's focus trap pulls focus back. No v3 option moves the carrier. (It does render *above* the Dialog — this is focus, not z-index.) | `disableEnforceFocus` on that `Dialog` |
| `getContents is not a function` / `setContents is not a function` | v2 API. | `editor.$.html.get()` / `.set()` |
| `onChange` handler receives an object | v3 events take one object. | `({ data }) => …` |

## Quick reference

**Install & import**

```bash
pnpm add suneditor@^3.4.1 && pnpm remove suneditor-react
```

```js
import 'suneditor/css/editor';                 // editor chrome
import 'suneditor/css/contents';               // only where you RENDER saved HTML (.sun-editor-editable)
const { default: suneditor, plugins } = await import('suneditor'); // inside useEffect
import ko from 'suneditor/langs/ko';           // optional; default is English
```

**Create** — target must be an element, after mount:

```js
const editor = suneditor.create(targetEl, {
  plugins: ['align', 'hr', 'link', 'image', 'list', 'table'].map((k) => plugins[k]),
  buttonList: [['bold', 'italic', 'backgroundColor', 'hr', 'list', 'table', 'link', 'image']],
  value: initialHtml,
  events: { onChange: ({ data }) => save(data) },
});
// …
editor.destroy();
```

**Most-used v2 → v3 renames** (all 128 in references/options-v2-to-v3.md)

| v2 | v3 |
|---|---|
| `setOptions={{…}}` (wrapper prop) | options object passed to `create` |
| `setDefaultStyle` / `defaultStyle` | `editorStyle` |
| `resizingBar` / `showPathLabel` | `statusbar` / `statusbar_showPathLabel` |
| `linkProtocol` | `defaultUrlProtocol` |
| `attributesWhitelist` / `attributesBlacklist` | `attributeWhitelist` / `attributeBlacklist` (singular) |
| `addTagsWhitelist` / `tagsBlacklist` | `elementWhitelist` / `elementBlacklist` |
| `imageFileInput` / `imageUrlInput` | `image.createFileInput` / `image.createUrlInput` |
| `imageSizeOnlyPercentage` | `image.percentageOnlySize` |
| `imageUploadUrl` / `imageUploadSizeLimit` | `image.uploadUrl` / `image.uploadSizeLimit` (number) |
| `videoIframeAttrs` / `videoTagAttrs` | `video.iframeTagAttributes` / `video.videoTagAttributes` |
| `videoWidth` / `videoHeight` / `videoResizing` / `videoRatioShow` | `video.defaultWidth` / `defaultHeight` / `canResize` / `showRatioOption` |
| `audioFileInput` | `audio.createFileInput` |
| `linkTargetNewWindow` | `link.openNewWindow` |
| `rtl: true` | `textDirection: 'rtl'` |
| `callBackSave` | `events.onSave` |
| `popupDisplay`, `pasteTagsWhitelist`, `className`, `imageRotation` | **removed** — delete them |

**Changing options later:** `editor.resetOptions({...})`. Options marked
`'fixed'` in `src/core/schema/options.js` (`plugins`, `buttonList`,
`mode`, `strictMode`, `lang`, `value`, `attributeWhitelist`, `attributeBlacklist`,
`allowedURLProtocols`, …) are create-time
only — remount to change them.

**Buttons:** `hiliteColor` → `backgroundColor`, `horizontalRule` → `hr`,
`formatBlock` → `blockStyle`. Unchanged: `bold`, `underline`, `italic`,
`strike`, `subscript`, `superscript`, `fontColor`, `textStyle`,
`removeFormat`, `outdent`, `indent`, `align`, `list`, `lineHeight`, `table`,
`link`, `image`, `video`, `audio`, `fullScreen`, `showBlocks`, `codeView`,
`undo`, `redo`, `preview`, `print`, `fontSize`.

## Plugins

Core commands (`bold`, `italic`, `undo`, `codeView`, `fullScreen`, …) need no
plugin. Every dropdown/modal/input button needs the plugin with the **same
key** as the button name: `align`, `audio`, `backgroundColor`, `blockStyle`,
`font`, `fontColor`, `fontSize`, `hr`, `image`, `lineHeight`, `link`, `list`,
`paragraphStyle`, `table`, `template`, `textStyle`, `video`, `math`, `embed`,
`drawing`, … Derive `plugins` from the button list; never pass the whole
export.

## React / Next.js

Mount directly; do not add a wrapper dependency to save forty lines. The full
tested component, with the reason for every line, is in
**references/react-mount.md**. Non-negotiables:

1. `'use client'` + `import('suneditor')` inside `useEffect` (no SSR, lazy chunk).
2. Target `<textarea>` created imperatively inside an empty React-owned `<div>`.
3. `cancelled` guard for StrictMode; `editor.destroy()` in cleanup.
4. `onChange` through a ref; content is a **seed**, reset by remounting with `key`.
   `editor.$.html.set()` also fires `onChange` — guard if you sync state both ways.
5. If the editor sits in an MUI `Dialog`: `disableEnforceFocus`.

## Theming

v3 colours come from `--se-*` custom properties. Map them to your tokens once,
globally, on `.sun-editor.sun-editor, .sun-editor-editable.sun-editor-editable`.
Built-in `theme: 'dark' | 'cobalt' | 'cream' | 'midnight'` needs its own CSS
import (`suneditor/src/themes/<name>.css`). Full mapping, renamed selectors
and a verification snippet: **references/theming.md**.

## Security boundary

Editor-side filtering (`strictMode`, `attributeBlacklist`, `elementWhitelist`)
only constrains what an author produces **in their own browser**; anyone can
POST HTML to your API directly. Sanitise on render (DOMPurify or similar) for
every piece of HTML written by someone else. `on*` attributes are always
stripped by v3's filter; that is not a substitute.

## Verifying a migration

1. `grep -rn "suneditor-react\|suneditor/dist\|hiliteColor\|horizontalRule\|formatBlock\|getContents\|setContents\|se-dialog\|se-resizing-bar" src`
   → zero hits.
2. Paste the old v2 options into the **Converter** at
   <https://suneditor.com/migration> (client-rendered — needs a real browser)
   and diff against what you wrote.
3. In a browser: toolbar renders every expected `button[data-command]`;
   typing reaches your `onChange`; no `[SUNEDITOR` console messages; open the
   image modal **inside every modal/dialog host** and type a URL; check
   `.sun-editor` background equals your surface token in light **and** dark.
