# Wiring @devopsnext/starterkit-intro

The provider needs two values: the **router-relative** pathname and the URL where
`public/intro/` is served. Everything else is optional (`autoStart`, `autoStartDelay`,
`storageKey`, `fetchIntro`, `onEvent`, `labels` — see the package README).

## Next.js App Router (`output: "export"` works — nothing runs on a server)

```jsx
// src/components/intro/AppIntro.jsx
"use client";
import { usePathname } from "next/navigation";
import { IntroProvider } from "@devopsnext/starterkit-intro";

export default function AppIntro({ children }) {
  const pathname = usePathname() || "/";               // excludes basePath
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // public/ is served under basePath
  return (
    <IntroProvider pathname={pathname} baseUrl={`${base}/intro`}>
      {children}
    </IntroProvider>
  );
}
```

```jsx
// the layout that renders your header + sidebar — wrap the WHOLE shell
<AppIntro>
  <Shell header={<Header helpMenu={<HelpMenu />} />}>{children}</Shell>
</AppIntro>
```

- `import "@devopsnext/starterkit-intro/styles.css"` in the root layout, after the theme sheets
  (Turbopack keeps CSS order only within one module — keep all global imports in one file).
- `trailingSlash: true` is fine: the package normalises `/a/b/` to `/a/b`.
- Keep `basePath` in `next.config` and `NEXT_PUBLIC_BASE_PATH` the same value; a mismatch is a 404,
  which the package treats as "no intro" — silently.

## Next.js Pages Router

Same component with `const { asPath } = useRouter(); const pathname = asPath.split(/[?#]/)[0];`
(`asPath` excludes `basePath`). Mount it in `_app.jsx` around the layout.

## React Router (v6/v7) + Vite

```jsx
function IntroShell({ children }) {
  const { pathname } = useLocation();                  // excludes the router basename
  return (
    <IntroProvider pathname={pathname} baseUrl={`${import.meta.env.BASE_URL}intro`}>
      {children}
    </IntroProvider>
  );
}
// inside <BrowserRouter> (it needs the router context)
```

With `createBrowserRouter`, render `IntroShell` in the root layout route's element, around the
header and `<Outlet />` — that is the one component inside the router that wraps every page.

`import.meta.env.BASE_URL` is Vite's `base` (where `public/` is served, already ending in `/`); the
router's `basename` is a separate setting. Set `baseUrl` from the first and let `useLocation()`
handle the second.

## The help menu — replay + auto-start switch

The package ships `IntroHelpButton` (one icon button) and `IntroAutoStartSwitch`. In an app with an
existing header-menu design, build the menu from `useIntro()` instead so it matches:

```jsx
const { hasIntro, start, autoStartEnabled, setAutoStartEnabled } = useIntro();
```

Three rules learned the hard way:

1. **Disable "Take a tour" when `!hasIntro`** and say why ("No intro for this page yet") — the menu
   is global, most apps will not have a file for every route.
2. **Close the menu, and give focus somewhere that survives.** The tour returns focus to whatever was
   focused when it started. Started from a menu item, that is an element the menu is about to hide,
   so focus falls to `<body>` after Esc. Focus the menu's toggle first:

   ```jsx
   onClick={(e) => {
     e.currentTarget.closest(".dropdown")?.querySelector("[aria-expanded]")?.focus();
     start();
   }}
   ```

   With reactstrap/Bootstrap dropdowns, render the row as `<DropdownItem>` (it closes the menu and
   joins arrow-key navigation); a plain `<button>` starts the tour with the menu still open.
3. **The switch row should NOT close the menu** (`<DropdownItem toggle={false}>`) — the user should
   see the state they set. reactstrap hard-codes `role="menuitem"` on `DropdownItem`, on which
   `aria-checked` is invalid; put "On"/"Off" in the row's visible text instead.

## Analytics

`onEvent({ type, route, stepId, index })` — `loaded`, `start`, `step`, `complete`, `skip`,
`missing-target`. `missing-target` in production is the runtime twin of `lint:intro`'s
"no element carries that key": worth logging.
