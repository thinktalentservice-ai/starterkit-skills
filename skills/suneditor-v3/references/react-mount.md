# Mounting SunEditor v3 in React / Next.js without a wrapper package

A complete, tested component (Next.js 16, React 19, StrictMode, App Router).
Copy it, then change the option values — not the mount mechanics.

```jsx
'use client';
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import 'suneditor/css/editor';            // NOT suneditor/dist/css/suneditor.min.css
// import 'suneditor/src/themes/dark.css'; // only if you use `theme: 'dark'`

/** Exactly the plugins the toolbar uses. See SKILL.md "Plugins". */
const PLUGIN_KEYS = ['align', 'backgroundColor', 'fontColor', 'hr', 'image', 'lineHeight',
  'link', 'list', 'table', 'textStyle', 'video'];

const BUTTONS = [['bold', 'underline', 'italic', 'strike', 'fontColor', 'backgroundColor',
  'textStyle', 'removeFormat', 'outdent', 'indent', 'align', 'hr', 'list', 'lineHeight',
  'table', 'link', 'image', 'video', 'codeView']];

const OPTIONS = {
  mode: 'classic',
  minHeight: '100px',
  statusbar: true,
  statusbar_showPathLabel: false,
  editorStyle: 'font-family: var(--font-body), sans-serif; font-size: 14px;',
  defaultUrlProtocol: 'https://',
  strictMode: true,
  // Defaults already cover src|width|height|allow|allowfullscreen|loading|sandbox|referrerpolicy.
  attributeWhitelist: { iframe: 'style' },
  attributeBlacklist: { img: 'onerror' },
  image: { createFileInput: false, percentageOnlySize: false, uploadSizeLimit: 2097152 },
  video: {
    createFileInput: false,
    defaultWidth: '100%',
    defaultHeight: '100%',
    showRatioOption: false,
    canResize: false,
    iframeTagAttributes: { sandbox: 'allow-same-origin allow-scripts allow-presentation', loading: 'lazy' },
  },
};

export default function RichTextEditor({ initialValue = '', onChange, placeholder, className }) {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  // suneditor binds events once at create; callers pass a new closure each render.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    let editor = null;
    let cancelled = false; // StrictMode runs this effect twice; the first run must not create

    import('suneditor') // dynamic: keeps ~300 KB out of the route chunk and off the server
      .then(({ default: suneditor, plugins }) => {
        if (cancelled || !host) return;
        // v3 HIDES its target and inserts its frame as the next sibling. Create the
        // target imperatively inside an EMPTY React-owned div so React never
        // reconciles nodes suneditor added.
        const target = document.createElement('textarea');
        host.appendChild(target);
        editor = suneditor.create(target, {
          ...OPTIONS,
          plugins: PLUGIN_KEYS.map((k) => plugins[k]),
          buttonList: BUTTONS,
          value: initialValue,
          placeholder,
          events: { onChange: ({ data }) => onChangeRef.current?.(data) },
        });
        setReady(true);
      })
      .catch((err) => console.error('[RichTextEditor] suneditor failed to load', err));

    return () => {
      cancelled = true;
      editor?.destroy(); // also removes the body-level carrier (modals, dropdowns)
      host?.replaceChildren();
    };
    // Seed-once by design: remount with a new `key` to reset content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      {!ready && <div style={{ minHeight: 100 }} aria-busy="true" />}
      <div ref={hostRef} />
    </div>
  );
}

RichTextEditor.propTypes = {
  /** Seed content, read once. Remount with a new `key` to replace it. */
  initialValue: PropTypes.string,
  /** Receives the editor HTML on every change. */
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
};
```

## Why each line is there

| Line | Without it |
|---|---|
| `import('suneditor')` inside the effect | A static import runs on the server during SSR; suneditor touches `document` at create time. It also puts ~300 KB in every route that renders the editor. |
| `cancelled` flag | StrictMode mounts → unmounts → mounts. Without the flag the first, already-cleaned-up run still creates an editor: two toolbars, one orphaned carrier on `<body>`. |
| imperative `<textarea>` inside an empty div | Rendering `<textarea ref>` in JSX lets React own a node suneditor hides and inserts siblings next to. Any re-render that touches that subtree can throw `NotFoundError: Failed to execute 'removeChild'`. |
| `onChangeRef` | `events.onChange` is captured at create. A plain `onChange` prop goes stale after the first render — state setters keep working, closures over props do not. |
| `value:` at create, no `$.html.set` on prop change (note: `$.html.set` pushes history, so it **also fires `onChange`**) | Re-applying content moves the caret to the start. Feeding live state back in makes the caret jump on every keystroke. Treat the prop as a seed; reset by remounting with a new `key`. |
| `plugins: PLUGIN_KEYS.map(...)` | Passing the whole `plugins` export boots exportPDF, math, template, layout, fileUpload — each logs `[SUNEDITOR.plugins.*]` on every mount, and imageGallery can fire a request to a URL you never configured. |
| `editor.destroy()` | The carrier wrapper lives on `document.body`, outside the host div. `replaceChildren()` alone leaves it behind. |

## Imperative API (when you hold the instance)

| v2 | v3 |
|---|---|
| `editor.getContents()` | `editor.$.html.get()` |
| `editor.setContents(html)` | `editor.$.html.set(html)` |
| `editor.appendContents(html)` | `editor.$.html.add(html)` |
| `editor.insertHTML(html)` | `editor.$.html.insert(html)` |
| `editor.readOnly(true)` | `editor.$.ui.readOnly(true)` |
| `editor.disable()` / `enable()` | `editor.$.ui.disable()` / `editor.$.ui.enable()` |
| `editor.setOptions(opts)` | `editor.resetOptions(opts)` |
| `editor.onChange = fn` | `events: { onChange: ({ data }) => … }` at create |
| `editor.destroy()` | `editor.destroy()` |

## Events whose signature changed

All events take ONE object argument in v3.

| Event | v3 argument |
|---|---|
| `onChange` | `{ $, frameContext, data }` — `data` is the editor HTML |
| `onImageUploadBefore` (and video/audio/file) | `{ $, info, handler }` — return `true` to let suneditor upload, `false` to insert yourself |
| `onPaste` | `{ event, data, from }` — return a string to replace, `false` to cancel |
| `onSave` | moved from the v2 `callBackSave` option |

## The official wrapper

`@suneditor/suneditor-react` (peer `suneditor ^3.4.1`) exists. As of 2026-11 it
is 1.0.0 and was days old. If you adopt it: its `value` prop is **controlled**
(changing it replaces content), its `options` prop is applied only at creation
except `events` and `theme`, and the legacy `suneditor-react` 3.x package is a
different package that only drives the v2 API.
