# SunEditor v2 → v3 option map

Source: the "Reference Table" tab of <https://suneditor.com/migration> (all
entries, captured 2026-11-07 against v3.4.x). The page renders this table
client-side, so a plain fetch of the URL returns an empty shell — open it in a
browser, or use this file.

The same page has a **Converter** tab: paste a v2 options object, get v3 back
with removed keys commented out. Run it on the real options before hand-editing.

## Corrections and gaps verified in `suneditor@3.4.1` source

The table is the docs site's view. These rows were checked against
`node_modules/suneditor/src/core/schema/options.js` and differ or need a note:

| v2 | Table says | Source says |
|---|---|---|
| `linkProtocol` | removed | **`defaultUrlProtocol`** (top-level, `"https://"`) exists — "Default URL protocol for links". |
| `attributesWhitelist: { all: '*' }` | renamed to `attributeWhitelist` | The all-tags key is **`'*'`**, not `all`. A key named `all` is treated as a tag called `<all>` and does nothing. `'*': '*'` allows every attribute name on every tag. |
| any `*Whitelist` / `*Blacklist` string | — | Lists are **`|`-delimited regex alternations**. `'src style width'` (spaces) compiles to one literal alternative and matches nothing. Write `'src|style|width'`. |
| per-tag `attributeWhitelist` entry | — | **Appended to** the default list, not a replacement. The default already allows `contenteditable|target|href|title|download|rel|src|alt|class|type|colspan|rowspan|start|width|height|controls|autoplay|loop|muted|poster|preload|playsinline|…|allowfullscreen|sandbox|loading|allow|referrerpolicy|frameborder|scrolling` — so `video.iframeTagAttributes` survive without whitelisting; only add what is missing (e.g. `style`). `on*` handlers are always stripped. |
| `imageUploadSizeLimit: '2097152'` | `image.uploadSizeLimit` | v3 expects a **number**. |
| `pasteTagsWhitelist` | removed | No paste-specific filter. Pasted HTML goes through the same `elementWhitelist`/`attributeWhitelist`/`strictMode` filters as everything else; `events.onPaste` can rewrite it. |

## Full table

| v2 | v3 | Note |
|---|---|---|
| `strictMode` | `strictMode` | — |
| `strictHTMLValidation` | **removed** | Removed in v3. Use the structured `strictMode` object (e.g. strictMode: { tags: true, attrs: true, styles: true }) |
| `lang` | `lang` | — |
| `defaultTag` | `defaultLine` | Renamed |
| `textTags` | `textStyleTags` | Renamed |
| `value` | `value` | — |
| `allowedClassNames` | `allowedClassName` | Renamed (singular) |
| `historyStackDelayTime` | `historyStackDelayTime` | — |
| `frameAttrbutes` | `editableFrameAttributes` | Typo fixed + renamed to editableFrameAttributes |
| `addTagsWhitelist` | `elementWhitelist` | Renamed |
| `tagsBlacklist` | `elementBlacklist` | Renamed |
| `pasteTagsWhitelist` | **removed** | Removed in v3 |
| `pasteTagsBlacklist` | **removed** | Removed in v3 |
| `attributesWhitelist` | `attributeWhitelist` | Renamed (singular) |
| `attributesBlacklist` | `attributeBlacklist` | Renamed (singular) |
| `mode` | `mode` | — |
| `rtl` | `textDirection` | Renamed. rtl: true → textDirection: 'rtl' |
| `lineAttrReset` | `lineAttrReset` | — |
| `toolbarWidth` | `toolbar_width` | Renamed (underscore) |
| `toolbarContainer` | `toolbar_container` | Renamed (underscore) |
| `stickyToolbar` | `toolbar_sticky` | Renamed |
| `hideToolbar` | `toolbar_hide` | Renamed |
| `fullScreenOffset` | `fullScreenOffset` | — |
| `iframe` | `iframe` | — |
| `fullPage` | `iframe_fullPage` | Renamed |
| `iframeAttributes` | `iframe_attributes` | Renamed (underscore) |
| `iframeCSSFileName` | `iframe_cssFileName` | Renamed |
| `previewTemplate` | `previewTemplate` | — |
| `printTemplate` | `printTemplate` | — |
| `codeMirror` | **removed** | Removed. Use externalLibs.codeMirror |
| `katex` | **removed** | Removed. Use externalLibs.katex or math.mathLib |
| `mathFontSize` | `math.fontSizeList` | Moved to plugin option |
| `position` | **removed** | Removed in v3 |
| `display` | **removed** | Removed in v3 |
| `popupDisplay` | **removed** | Removed in v3 |
| `resizingBar` | `statusbar` | Renamed |
| `showPathLabel` | `statusbar_showPathLabel` | Renamed |
| `resizeEnable` | `statusbar_resizeEnable` | Renamed |
| `resizingBarContainer` | `statusbar_container` | Renamed |
| `charCounter` | `charCounter` | — |
| `charCounterType` | `charCounter_type` | Renamed (underscore) |
| `charCounterLabel` | `charCounter_label` | Renamed (underscore) |
| `maxCharCount` | `charCounter_max` | Renamed |
| `width` | `width` | — |
| `minWidth` | `minWidth` | — |
| `maxWidth` | `maxWidth` | — |
| `height` | `height` | — |
| `minHeight` | `minHeight` | — |
| `maxHeight` | `maxHeight` | — |
| `className` | **removed** | Removed in v3 |
| `defaultStyle` | `editorStyle` | Renamed |
| `font` | `font.items` | Moved to plugin option |
| `fontSize` | `fontSize.sizeUnit (array removed)` | v3 uses input, not dropdown array |
| `fontSizeUnit` | `fontSize.sizeUnit` | Moved to plugin option |
| `alignItems` | `align.items` | Renamed & moved to plugin option |
| `formats` | `blockStyle.items` | Renamed & moved to plugin option |
| `colorList` | `fontColor.items / backgroundColor.items` | Split into two plugin options |
| `lineHeights` | `lineHeight.items` | Renamed & moved to plugin option |
| `paragraphStyles` | `paragraphStyle.items` | Moved to plugin option |
| `textStyles` | `textStyle.items` | Moved to plugin option |
| `imageResizing` | `image.canResize` | Renamed |
| `imageHeightShow` | `image.showHeightInput` | Renamed |
| `imageAlignShow` | **removed** | Removed. Use image.controls |
| `imageWidth` | `image.defaultWidth` | Renamed |
| `imageHeight` | `image.defaultHeight` | Renamed |
| `imageSizeOnlyPercentage` | `image.percentageOnlySize` | Renamed |
| `imageRotation` | **removed** | Removed in v3 |
| `imageFileInput` | `image.createFileInput` | Renamed |
| `imageUrlInput` | `image.createUrlInput` | Renamed |
| `imageUploadHeader` | `image.uploadHeaders` | Renamed (plural) |
| `imageUploadUrl` | `image.uploadUrl` | Moved to plugin option |
| `imageUploadSizeLimit` | `image.uploadSizeLimit` | Moved to plugin option |
| `imageMultipleFile` | `image.allowMultiple` | Renamed |
| `imageAccept` | `image.acceptedFormats` | Renamed |
| `imageGalleryData` | `imageGallery.data` | Moved to plugin option |
| `imageGalleryUrl` | `imageGallery.url` | Moved to plugin option |
| `imageGalleryHeader` | `imageGallery.headers` | Moved to plugin option |
| `videoResizing` | `video.canResize` | Renamed |
| `videoHeightShow` | `video.showHeightInput` | Renamed |
| `videoAlignShow` | **removed** | Removed. Use video.controls |
| `videoRatioShow` | `video.showRatioOption` | Renamed |
| `videoWidth` | `video.defaultWidth` | Renamed |
| `videoHeight` | `video.defaultHeight` | Renamed |
| `videoSizeOnlyPercentage` | `video.percentageOnlySize` | Renamed |
| `videoRotation` | **removed** | Removed in v3 |
| `videoRatio` | `video.defaultRatio` | Renamed |
| `videoRatioList` | `video.ratioOptions` | Renamed |
| `youtubeQuery` | `video.query_youtube` | Renamed & moved to plugin option |
| `vimeoQuery` | `video.query_vimeo` | Renamed & moved to plugin option |
| `videoFileInput` | `video.createFileInput` | Renamed |
| `videoUrlInput` | `video.createUrlInput` | Renamed |
| `videoUploadHeader` | `video.uploadHeaders` | Renamed (plural) |
| `videoUploadUrl` | `video.uploadUrl` | Moved to plugin option |
| `videoUploadSizeLimit` | `video.uploadSizeLimit` | Moved to plugin option |
| `videoMultipleFile` | `video.allowMultiple` | Renamed |
| `videoTagAttrs` | `video.videoTagAttributes` | Renamed |
| `videoIframeAttrs` | `video.iframeTagAttributes` | Renamed |
| `videoAccept` | `video.acceptedFormats` | Renamed |
| `audioWidth` | `audio.defaultWidth` | Renamed & moved to plugin option |
| `audioHeight` | `audio.defaultHeight` | Renamed & moved to plugin option |
| `audioFileInput` | `audio.createFileInput` | Renamed |
| `audioUrlInput` | `audio.createUrlInput` | Renamed |
| `audioUploadHeader` | `audio.uploadHeaders` | Renamed (plural) |
| `audioUploadUrl` | `audio.uploadUrl` | Moved to plugin option |
| `audioUploadSizeLimit` | `audio.uploadSizeLimit` | Moved to plugin option |
| `audioMultipleFile` | `audio.allowMultiple` | Renamed |
| `audioTagAttrs` | `audio.audioTagAttributes` | Renamed |
| `audioAccept` | `audio.acceptedFormats` | Renamed |
| `tableCellControllerPosition` | `table.cellControllerPosition` | Moved to plugin option |
| `linkTargetNewWindow` | `link.openNewWindow` | Renamed & moved to plugin option |
| `linkProtocol` | `defaultUrlProtocol` | The docs table says "Removed in v3"; 3.4.1 source has `defaultUrlProtocol` (top-level). See Corrections above. |
| `linkRel` | `link.relList` | Renamed & moved to plugin option |
| `linkRelDefault` | `link.defaultRel` | Renamed & moved to plugin option |
| `linkNoPrefix` | `link.noAutoPrefix` | Renamed & moved to plugin option |
| `hrItems` | `hr.items` | Moved to plugin option |
| `tabDisable` | `shortcutsDisable` | Use shortcutsDisable: ['tab'] |
| `shortcutsDisable` | `shortcutsDisable` | — |
| `shortcutsHint` | `shortcutsHint` | — |
| `callBackSave` | `events.onSave` | Moved to events |
| `templates` | `template.items` | Moved to plugin option |
| `__allowedScriptTag` | **removed** | Removed in v3 |
| `placeholder` | `placeholder` | — |
| `mediaAutoSelect` | **removed** | Removed in v3 |
| `icons` | `icons` | — |
| `buttonList` | `buttonList` | — |
| `formatBlock (button)` | `blockStyle (button)` | Button renamed |
| `hiliteColor (button)` | `backgroundColor (button)` | Button renamed |
| `horizontalRule (button)` | `hr (button)` | Button renamed |
| `` | `128 / 128 entries` | — |
