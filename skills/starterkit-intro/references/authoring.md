# Authoring intro content

## The file

`public/intro/<routeToIntroPath(route)>`:

```json
{
  "schema": 1,
  "route": "/design/badge",
  "revision": 1,
  "title": "Badges",
  "steps": [
    { "id": "welcome", "title": "Welcome to Badges", "body": "What this page is for, in one or two sentences." },
    { "id": "badge-sizes", "target": "[data-intro=\"badge-sizes\"]", "title": "Size scale", "body": "…", "placement": "top" },
    { "id": "il-sidebar", "target": ".il-sidebar", "title": "Navigation", "body": "…", "placement": "right", "optional": true }
  ]
}
```

Unknown keys are errors (a typo like `"placment"` fails `lint:intro` instead of being ignored).
Full field rules and limits: the package README.

## Capture loop

```bash
pnpm intro:list                      # route → URL → file; no browser
pnpm intro:capture                   # app running; writes/merges drafts
pnpm intro:capture --route /settings # one page
pnpm lint:intro
```

- Pages behind a login need `--storage-state <file>` — a Playwright storage-state JSON saved by a
  login script. It does not carry sessionStorage, and it is tied to one origin. A capture that
  reports "redirected to …" for every route is a dead session, not a CLI bug.
- If the login page has a CAPTCHA, do not automate around it: log in by hand in a headed browser
  and save the state, or capture public routes only and write the rest by hand (the gate checks
  hand-written files exactly like captured ones).
- `--exclude <prefix>` is segment-aware and **fails when it matches nothing** — a typo would
  otherwise capture the pages it was meant to keep out.
- Non-Next routers: list pages with repeated `--url`; the route is the URL path minus `--base-path`.

## Writing the copy

- **Welcome step first, no `target`** — a centred card: what the page is for, what the user can do.
- **One step per tagged area, in reading order.** 4–7 steps per page; past that users skip.
- Title ≤ 40 characters, sentence case. Body 1–2 sentences, ≤ ~180 characters, second person,
  concrete: what the user can *do* or *learn* there, not what the code is.
- Describe what is really rendered. Read the element before writing about it — copy written from
  the component's props drifts from what users see.
- `placement`: leave it out (`auto`) unless the target is very wide or tall; for a full-width table,
  `"top"`. When no side has room the package docks the popover at the bottom of the viewport.
- Plain text only — bodies render as text, never HTML or Markdown.

## Revision

`revision` is the "show this again" switch. Auto-start fires once per `(route, revision)` per
browser. Bump it when a change is worth interrupting people who already saw the tour (new section,
changed workflow) — not for a typo fix. The CLI never changes it.

## Draft and stale

| Flag | Set by | Means | Runtime | Gate |
|---|---|---|---|---|
| `draft: true` | capture, on every new step | placeholder, body may be empty | never shown | warning |
| `stale: true` | capture, when a target vanished | tag renamed/removed, or hidden at capture | step skipped if still missing | warning |

Neither is ever removed automatically. A step stays `stale` until a capture finds its target again
or a person deletes it.
