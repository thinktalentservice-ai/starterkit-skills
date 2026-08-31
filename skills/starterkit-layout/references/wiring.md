# Wiring the shell — the full recipe

Loaded on demand from [../SKILL.md](../SKILL.md). Everything here is derived from
`@devopsnext/starterkit-layout@1.4.1` and from the reference wiring in
`template-starterkit-nextjs` — the only app known to be on the current version.

## 1. The stylesheet, once, at the app root

The shell's CSS is a separate import from the module. It goes in the root layout (`_app` on the
Pages Router), never in a component:

```jsx
// src/app/layout.jsx
import "@devopsnext/starterkit-theme/presets/<your-preset>.css";
import "@devopsnext/starterkit-button-component/styles.css";
import "@devopsnext/starterkit-card-component/styles.css";
import "@devopsnext/starterkit-layout/styles.css";
import "@devopsnext/starterkit-theme/styles.css";
import "simplebar-react/dist/simplebar.min.css";
import "@/styles/your-app.css";
```

**Order is not load-bearing between the starterkit packages** — none of them declares anything on
`:root`, each aliases the tokens it reads as `var(--your-token, <vendored default>)`, so your sheet
wins wherever you define a token no matter which line comes first. Two things are still ordered:

- Your own overrides last, so "the app wins" is true rather than accidental.
- **Bundlers preserve CSS order within a module, not across modules.** In a Turbopack/webpack app all
  of these must stay in this one file; moving one into a component forfeits its position.

Two prerequisites the package cannot import for you:

- **Bootstrap 5.3 utility CSS.** Without it the shell is a broken vertical stack and nothing throws.
- **`simplebar-react/dist/simplebar.min.css`**, above.

Fonts are yours too. The type tokens name families and fall back to `system-ui`; load Outfit and
Plus Jakarta Sans with `next/font` (self-hosted, CSP-safe).

## 2. One adapter file, and only one

The package is stateless, so everything app-specific lands in a single seam. If that coupling
spreads across files, the extraction has failed and the next fork starts copy-pasting again.

```
src/app/(DashboardLayout)/
  layout.jsx          → renders <DashboardShell>{children}</DashboardShell>, nothing else
  DashboardShell.jsx  → "use client". THE seam: store, i18n, nav fetch, dropdown panels
  layouts/header/*    → the dropdown panel bodies — this app's DATA, not shell chrome
```

### Store-free version

```jsx
"use client";
import { useMemo, useState } from "react";
import { FullLayout, toNavItems } from "@devopsnext/starterkit-layout";

export default function DashboardShell({ children, rows }) {
  const [mini, setMini] = useState(false);
  const [drawerOpen, setDrawer] = useState(false);
  const navItems = useMemo(() => toNavItems(rows), [rows]);

  return (
    <FullLayout
      navItems={navItems}
      miniSidebar={mini}
      mobileSidebarOpen={drawerOpen}
      onToggleMini={() => setMini((v) => !v)}
      onToggleMobile={() => setDrawer((v) => !v)}
      onCloseMobile={() => setDrawer(false)}
    >
      {children}
    </FullLayout>
  );
}
```

`onCloseMobile` is `setDrawer(false)`, never a toggle: it fires for overlay click, Escape, route
change and crossing up into desktop, **including on already-closed transitions**. A toggle reopens
the drawer on a transition that was already closed.

### Store-backed version

Map the four booleans and three callbacks onto whatever you use. The shell never reads the store
itself — that is precisely what made the original layout uncopyable.

```jsx
const miniSidebar        = useSelector((s) => s.customizer.isMiniSidebar);
const mobileSidebarOpen  = useSelector((s) => s.customizer.isMobileSidebar);
const isTopbarFixed      = useSelector((s) => s.customizer.isTopbarFixed);
const isSidebarFixed     = useSelector((s) => s.customizer.isSidebarFixed);
const isRTL              = useSelector((s) => s.customizer.isRTL);

<FullLayout
  miniSidebar={miniSidebar}
  mobileSidebarOpen={mobileSidebarOpen}
  isTopbarFixed={isTopbarFixed}
  isSidebarFixed={isSidebarFixed}
  isRTL={isRTL}
  onToggleMini={() => dispatch(ToggleMiniSidebar())}
  onToggleMobile={() => dispatch(ToggleMobileSidebar())}
  onCloseMobile={() => dispatch(CloseMobileSidebar())}
  …
/>
```

## 3. Navigation

The package has no data source. Fetch or import your rows, **filter them by status and role
yourself**, then map:

```jsx
const [rows, setRows] = useState([]);
useEffect(() => { getNavigationList().then(setRows); }, []);
const navItems = useMemo(() => toNavItems(rows), [rows]);
```

Translate in exactly one place. Either `toNavItems(rows, { t })` **or** `<FullLayout t={t}>` — never
both, or every title goes through `t(t(key))`. Passing it to `FullLayout` is the simpler path and
also covers captions, which `toNavItems` never produces. If your fetch layer already translated the
titles (some do), pass `t` to neither.

## 4. Brand slots — both live in the topbar

`favicon` is the desktop lockup, `logo` is the sub-`lg` mark. They default to `<Favicon>` and
`<Logo>` with the package's own placeholder brand.

For a **single-brand app**, one line each is enough:

```jsx
favicon={<Favicon brandName={APP_TITLE} miniSidebar={miniSidebar} mark={<Rocket />} />}
```

For a **white-labelled deployment**, the artwork is per-session and the two endpoints are two
different pictures — a favicon-shaped mark and a full logo. Pass `bare` on both, because each
endpoint returns a finished file that already carries its own shape:

```jsx
favicon={
  <Favicon
    brandName={APP_TITLE}          // fallback text, and the alt text
    miniSidebar={miniSidebar}
    bare
    {...(session.faviconSrc ? { markSrc: session.faviconSrc, markAlt: session.markAlt } : {})}
    {...(session.logoSrc ? { wordmarkSrc: session.logoSrc, wordmarkAlt: session.markAlt } : {})}
  />
}
logo={
  <Logo bare {...(session.logoSrc ? { markSrc: session.logoSrc, markAlt: session.markAlt } : {})} />
}
```

Spread conditionally rather than passing `undefined` or `""`: with no session there is no `markSrc`
and the package falls back to its own boxed glyph, which is the correct empty state. That fallback is
why `bare` is an explicit prop and not something inferred from `markSrc`.

Same rule for the user: `sidebarUser={{ initials: "", name: "" }}` renders an **empty avatar**, so
omit the prop entirely when there is nobody signed in.

```jsx
{...(session.name ? { sidebarUser: { initials: session.initials, name: session.name } } : {})}
```

If the values come out of browser storage, read them in an effect, not in the render body — under a
prerendered or exported build, reading during render is a hydration mismatch, not merely an early
read.

## 5. Header dropdowns

The array is chrome; the panel bodies are your app's data and stay in your repo.

```jsx
headerDropdowns={[
  { id: "notifications", icon: <Bell size={17} />,       label: "Notifications", content: <NotificationDD /> },
  { id: "messages",      icon: <Mail size={17} />,       label: "Messages",      content: <MessageDD /> },
  { id: "mega",          icon: <LayoutGrid size={17} />, label: "Apps",          content: <MegaDD />,
    width: "mega", scrollMaxHeight: false },
]}
```

`scrollMaxHeight: false` on the mega panel is not optional styling: the mega menu already scrolls
itself at 480px, so leaving the 350px default on nests a second scroll region inside the first.

Something that does not fit a 300px panel — a modal, an iframe, a full page — is **not** a
`headerDropdowns` entry. Give it a plain slot instead: `headerActionsSlot` puts it in the right-hand
cluster after the theme toggle and before the avatar; `headerEndSlot` is past the avatar.

## 6. The profile menu, and the way out

```jsx
profile={{
  ...(session.initials ? { initials: session.initials } : {}),
  menu: <ProfileDD />,
}}
```

```jsx
// ProfileDD.jsx — the only parts a shell package cannot own: this app's session,
// and this app's way out.
<ProfileMenu
  name={user.name}
  email={user.email}
  initials={user.initials}          // same helper the sidebar uses, so all three agree
  photoSrc={photoSrc}               // an OBJECT URL you fetched, never the API endpoint
  logoutHref={`${BASE_PATH}/login/logout`}
  logoutLabel={t("user.logout", { defaultValue: "Sign out" })}
/>
```

Three things go wrong here and all three are quiet:

1. **The photo.** If the endpoint needs a bearer token, an `<img src>` cannot send one — it 401s and
   every user gets initials. Fetch the bytes host-side, hand over an object URL, revoke it on
   unmount.
2. **`basePath`.** `logoutHref` renders as a plain `<a href>`; nothing prepends a basePath. A bare
   `"/login/logout"` resolves at the origin root — fine in `next dev`, a 404 on every deployed
   bundle, on the one control a user reaches when they are already trying to leave.
3. **Where logout points.** Point it at *your* logout route, not straight at the IdP's `/logout`. An
   anchor cannot run code, so the storage and cookie clear has to live behind a route; jumping
   straight at the IdP ends its session and leaves this origin's storage intact, and the next visit
   is a signed-in-looking shell whose every call 401s. Your route finishes by replacing the location
   with the IdP url.

`ProfileMenu` renders its id block unconditionally, so an empty session is a blank disc above two
blank rows. Pick a branch deliberately — guard the wrapper, or accept the blanks — and write down
which.

## 7. The login page — use `./brand`

A login page renders outside the shell. Importing the main entry there drags reactstrap, simplebar
and motion into that route's bundle for one logo.

```jsx
"use client";
import { AuthLogo } from "@devopsnext/starterkit-layout/brand";

<div style={{ marginBottom: 40 }}>
  <AuthLogo brandName={APP_TITLE} {...(LOGO ? { markSrc: LOGO } : {})} />
</div>
```

Page layout — the margin above the form — is the call site's, not the package's. A thin local wrapper
holding exactly that is the seam, not ceremony.

`Favicon` is **not** on this entry (it needs `motion`). `BrandMark`, `Logo`, `AuthLogo` and
`DEFAULT_BRAND_NAME` are.

## 8. RTL

`isRTL` sets `dir="rtl"` on the shell wrapper and flips **this package's own geometry only**.
Flipping Bootstrap's utilities — `.me-auto`, `.btn-group`, form controls, the spacing sweep — is the
host's job, and the package deliberately does not ship a second copy of that sweep.

If your own RTL overrides are scoped under a class (`.rtl`), the shell's `dir` attribute will not
trigger them. Pass the class too:

```jsx
className={isRTL ? "rtl" : "ltr"}
```

Without it the layout mirrors and every override you own silently stops applying.

## 9. Geometry overrides

`geometry` maps 1:1 onto three custom properties written inline on the shell element. Numbers are
px; omitted fields leave the stylesheet default standing.

```jsx
geometry={{ sidebarWidth: 260, miniSidebarWidth: 88, topbarHeight: 64 }}
```

For anything derived from those (`--il-rail-center`, `--il-label-x`, `--il-toggle-clearance`),
re-declare on `.il-shell` — **never on `:root`**, which freezes the default and silently ignores this
prop. See [namespace.md](namespace.md).

## 10. Assembling the shell by hand

`FullLayout` is the wiring between `Header` and `Sidebar`, not a wrapper that hides them. Render them
directly when you need something `FullLayout` does not forward — `staggerDelay`, an unusual
arrangement, a second shell.

If you do, you own what `FullLayout` was doing for you:

```jsx
const shellRef = useRef(null);
const { hidden, topbarHeight } = useHeaderAutoHide({ shellRef });
const isDesktop = useIsDesktop();
useDrawerChrome({ open, onClose, pathname, isDesktop });
```

- `shellRef` must point at the element carrying the geometry properties. This package declares
  nothing on `:root`, so measuring `documentElement` returns `null` forever and the sidebar never
  docks.
- The drawer needs `inert` below `lg` while closed, or a keyboard user tabs into an off-screen menu.
- `mobileSidebarId` must match the `<aside id>` and the hamburger's `aria-controls` — `FullLayout`
  wires both from one prop, so only a hand-rolled header can break it.

**Do not call these hooks alongside `FullLayout`.** It already calls all three, and a second
`useDrawerChrome` doubles the body-overflow save and restore.

## 11. Local development against an unpublished build

Never `link:`. Pack a tarball, which behaves exactly like a registry install and tests what actually
ships:

```bash
pnpm build && pnpm pack
```

```bash
pnpm add ./../starterkit-layout/devopsnext-starterkit-layout-1.4.1.tgz
```

A linked package resolves react from its own directory, and React identity is per module instance —
matching version numbers do not save you from `Invalid hook call`.
