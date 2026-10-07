---
name: starterkit-config-util
description: Use when adopting, wiring, debugging or extending @devopsnext/starterkit-config-util in a Think Talent frontend — installing or pinning it, editing src/config/index.js, derive.js or env.base.js, reading a key such as STORAGE_SECRET or OAUTH_SERVICE_URL, choosing normalizeOrigin vs resolveServiceOrigin for a build served from several hostnames, running the javascript_integration table through loadIntegrations/selectIntegrations, adding a health check, probe or CSP gate, or diagnosing "every user appears signed out", "undefined/oauth/authorize", "one host shows another environment's data", "API calls go to the host the build named", "env.json overrides are ignored", "env.json keys are NEXT_PUBLIC_-prefixed", "the integrations never load and there is no error", "two Freshworks widgets", "ERR_REQUIRE_ESM", or a green build whose service URLs are empty.
license: MIT
compatibility: Requires pnpm 9+ and a Node 18+ frontend that consumes @devopsnext/starterkit-config-util. Some checks reference repo-local gate scripts under scripts/.
metadata:
  author: thinktalentservice-ai
  version: "1.3"
---

# starterkit-config-util

`@devopsnext/starterkit-config-util` owns app-config resolution, AES browser storage,
the authenticated fetch layer and the third-party-integration loader for the Think
Talent frontends. It exists because three apps carried byte-identical copies of the
same ~140 lines and drifted — and, for the integration loader, because that one rule
had been written **eight** times across the family and the copies had already drifted.

**The core principle, and everything below follows from it:**

> The package owns MECHANISM. Your repo owns DATA. Every failure mode in this
> document is someone moving one across that line — or the package reading a
> value the repo stopped defining, in a place no gate can see.

## Read this first: the failure modes that produce a GREEN BUILD

The package's own README explains the API well. What it cannot tell you is which
mistakes are silent. These are, and each has a specific counter below.

| Symptom | Cause | Counter |
|---|---|---|
| Every user appears signed out. **No console error at all.** Build green. | The secret is *wrong or changed*, not missing — writes succeed, reads fail, and reads swallow. | never let `env.json` set `STORAGE_SECRET`; see Diagnostics |
| Login dies at the callback with a thrown error. | The secret is *missing*. **Writes do not swallow** — `setCookie`/`setLocalStorage` let `assertSecret` throw. | `hasConfigSource()` self-check + gate assertions |
| One config key ignores a post-deploy `env.json` while every other key honours it. | Something captured that value at module scope. | Read inside the function, never at module scope |
| Login redirects to `undefined/oauth/authorize?…`. All routes prerendered. | An env config is missing a key another env defines. | The consumer's env-config gate, kept intact |
| One build, served from a second hostname, shows **real data from another environment**. Every request 200. | `NEXT_PUBLIC_SERVICE_URL` is inlined on the build machine, so every host the artefact is served from calls the host the build named. | `resolveServiceOrigin` (0.4.0+); see One build, several hosts |
| `env.json` "applies" and changes nothing — its keys land on the config object under names no code reads. | The payload is in a dialect the decoder does not normalise: `REACT_APP_idleTime`, `allowedDomains`. `NEXT_PUBLIC_*` **is** normalised since 0.2.0. | `unknownKeys()`, printed by the build **and** the browser |
| A third-party widget (support chat, onboarding tour) is simply absent. HTTP 200, table intact. | An allow-list voided by an unsubstituted `%…%`, a host that does not match exactly, an `ALLOWED_DOMAIN` value that is not `"Y"`/`"N"`, or a call made before the `env.json` overlay applied. | read `LoadIntegrationsResult`; see Integrations |
| Two support widgets / two onboarding tours in dev. | A once-guard that `await`s before it writes, so StrictMode's second invoke passes it. | set the guard **synchronously**, in the DOM |
| Integration scripts are appended and never run. Console shows `ReferenceError` on a global, pointing at the integration rather than at the policy. | `script-src` does not name the third-party origin, so the external row is CSP-blocked while the inline rows still execute. | `extractIntegrationOrigins` in a repo gate |

## Quick reference — entries

| Import | Gives you | Peers pulled |
|---|---|---|
| `@devopsnext/starterkit-config-util` | `normalizeOrigin`, `resolveServiceOrigin` + `isLoopbackHostname` (0.4.0+), `createAppConfig`, `setConfigSource`, `getConfig`, `hasConfigSource`, `requiredConfigKeys`, `DEFAULT_CONFIG_KEYS`, `parseBoolean`, `getEnvBoolean`, `parseNumber` | **none** |
| `…/env-json` | `decodeEnvJson`, `unknownKeys`, `normalizeEnvJsonKeys`, `describeEnvJsonKeyChanges`, `ENV_JSON_KEY_PREFIX` | react-security-util |
| `…/storage` | `ApiUtils` (default), `createApiUtils`, `encodeJwtString`, `decodeJwtString`, `hasStorageSecret` | jose, secure-ls, react-security-util |
| `…/fetch` | `authFetch`, `getJSON`, `postJSON`, `putJSON`, `deleteJSON`, `postFormData`, `postBinary`, `getBlob`, `probeFetch`, `authHeaders`, `getToken`, `createFetchHelpers` | via `…/storage` |
| `…/payload` | `buildCompressedPayload` | react-security-util |
| `…/integrations` (0.3.0+) | `loadIntegrations`, `selectIntegrations`, `parseAllowedDomains`, `extractIntegrationOrigins`, `extractIntegrationUrlHints` | **none** |

Import the **narrowest** entry. The `.` entry is zero-dependency on purpose — a
route that only wants `parseBoolean` must not pull `jose` and `secure-ls` into
its bundle. **`./integrations` is zero-dependency for a second reason**, enforced by
the package's own `check-dist` assertion 3b: it is imported under plain Node by build
gates and by Express servers that install none of the peers.

## Installing — always the latest version, always pinned exactly

**Always two steps. Never one.** Look up the current latest, then install *that
literal version number*. Never install a range, and never assume the version this
file names is still latest.

**Step 1 — ask the registry what latest is.** Either of these; the CLI is
preferred because its answer pastes straight into step 2:

```bash
npm view @devopsnext/starterkit-config-util version
```

Or read it off the package page — the version is at the top right:
<https://www.npmjs.com/package/@devopsnext/starterkit-config-util>
(`npm view @devopsnext/starterkit-config-util versions --json` lists every
published version; `… time --json` adds the publish timestamps you will need for
Trap 2 below.)

**Step 2 — install that exact number**, substituting whatever step 1 returned:

```bash
pnpm add @devopsnext/starterkit-config-util@<version-from-step-1>
```

At the time this file was written step 1 answered `0.4.0`, so step 2 was
`pnpm add @devopsnext/starterkit-config-util@0.4.0`.

`package.json` must end up holding the bare number —
`"@devopsnext/starterkit-config-util": "0.4.0"`. **Open it and check.**

**Trap 1 — a one-step install records a range.** Measured against pnpm 11.11.0 on
a clean project:

| Command | Writes |
|---|---|
| `pnpm add …-config-util@0.4.0` | `"0.4.0"` ✅ exact |
| `pnpm add …-config-util@latest` | `"^0.4.0"` ❌ caret |

Same for `@^0`, `@~0.1`, `@*` and a bare `pnpm add <pkg>` — all of them record a
range. A caret fails any `pinned === installed` gate, and it lets a minor bump
change how every API response in the app is parsed with no review. If your client
widened it anyway, re-add with `--save-exact` (npm/pnpm) or `--exact` (yarn).

Step 1 is not there to avoid new versions — it is there to take the newest one
**deliberately**, on a line someone can review. Upgrading later is the same two
steps: re-run step 1, and if the number moved, re-run step 2 with it.

**Trap 2 — a MISSING `minimumReleaseAgeStrict` lets pnpm exempt the package for you.**

The root cause is the missing flag, not the entry pnpm writes. Fix the flag first,
or pnpm silently re-appends on the next same-day adoption:

```yaml
minimumReleaseAge: 1440
minimumReleaseAgeStrict: true        # <- without this, pnpm edits the file itself
```

Measured: installing a package younger than the window **without** the strict flag
makes pnpm **create or edit `pnpm-workspace.yaml`** and append:

```yaml
minimumReleaseAgeExclude:
  - '@devopsnext/starterkit-config-util@0.4.0'      # <- no marker, no reason
```

It installs anyway and the line scrolls past. If your repo runs a release-age gate,
that entry fails it. **Two different repairs, and picking the wrong one keeps it red:**

- **Window has NOT passed** → keep the line, add the publish-time marker.
- **Window HAS passed** → *delete the line*. A marker on an expired entry fails as
  EXPIRED. By then the package installs on its own age, so removing it is safe.
- **Consumer sets no `minimumReleaseAge` at all** → pnpm appends nothing and there is
  nothing to mark. Skip this entirely rather than inventing an entry.

To keep it (window still open):

```yaml
  # Bridge, not a setting. Delete once the window has passed; by then the package
  # installs on its own age, so removing it cannot break resolution.
  - '@devopsnext/starterkit-config-util@0.4.0' # published 2026-10-07T08:59:34Z
```

Get the real timestamp with `npm view <pkg> time --json`. **Not**
`npm view <pkg> time.1.0.0` — npm splits field paths on `.`, so that asks for
`time → 1 → 0 → 0` and returns nothing, which reads as "unpublished".

## Wiring — one call, and a self-check that is not optional

```js
// src/config/index.js
import { createAppConfig, hasConfigSource, setConfigSource } from "@devopsnext/starterkit-config-util";
import baseEnv from "./env.base";
import devEnv from "./env.dev";
import thinkEnv from "./env.think";

const ENV_CONFIGS = { dev: devEnv, think: thinkEnv };   // keep this a literal

const config = createAppConfig({
  base: baseEnv,
  envs: ENV_CONFIGS,
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || "dev",
  overrides: envJsonSnapshot.overrides,   // optional — omit if you have no env.json layer
});

setConfigSource(config, { mirrorRaw: true });
if (!hasConfigSource()) {
  throw new Error("src/config: setConfigSource() did not take.");
}

export default config;
```

**Why the throw.** Under `output: 'export'` nothing in a prerendered route touches
the registry at module scope, so **deleting the `setConfigSource` call is a green
build** and a browser-only failure that presents as "every user is signed out".
The self-check is what converts that into a build error. Do not remove it because
it "can't happen".

**Pass the object, never a snapshot of its values.** The package holds the
reference so a runtime `Object.assign(config, overrides)` overlay reaches it.

`setConfigSource` **throws on an unknown option** — including the easy slip
`{ storageSecret: … }` instead of `{ keys: { storageSecret: … } }`.

## `env.json` keys — verbatim, minus one prefix

A key in `env.json` **is** the config key. There is no camelCase table and there
never will be — the decoder carried one once, and it failed in the direction
nobody notices: a key with no row lands on the config object under a name nothing
reads, so the override is "applied" and changes nothing.

**Since 0.2.0 `decodeEnvJson()` strips exactly one prefix: `NEXT_PUBLIC_`.**

```
{"NEXT_PUBLIC_IDLE_TIME": 3600, "INTEGRATION_ALLOWED_DOMAINS": "a.example"}
              |                                    |
              v                                    v
   appConfig.IDLE_TIME                appConfig.INTEGRATION_ALLOWED_DOMAINS
```

**Why that one is a normalisation and not a translation.** `NEXT_PUBLIC_` is the
marker that tells the Next compiler to inline a `process.env` read into the client
bundle. `env.json` never touches `process.env` — it is decrypted and assigned onto
the config object — so on that side the prefix carries no meaning at all. One rule,
no table, no key that can fail to have a row. **It stays required in `.env.*`
files**, where it does mean something: `env.base.js` reads
`process.env.NEXT_PUBLIC_IDLE_TIME` and re-exports it as `IDLE_TIME`. Two
namespaces; only the `env.json` side is normalised.

**Why it is in the package and not in your repo.** Every consumer decodes
`env.json` **twice** — once in a build script that bakes it into the bundle, once
in the browser that re-applies the deployed copy. A strip written app-side has to
be wired into both. Wire only one and you get a build whose baked values and
deployed values disagree about what the file means — with no error. That is the
failure a shared decoder exists to prevent, so **do not add a host-side
normaliser**; there is nothing to wire.

**What it cost before 0.2.0**, in a real deployment: the pipeline emitted
`NEXT_PUBLIC_IDLE_TIME` / `NEXT_PUBLIC_INTEGRATION_ALLOWED_DOMAINS`, those landed
as three new properties nothing read, and the environments where `env.json` was
the **only** source for those keys fell back to build-time defaults —
`INTEGRATION_ALLOWED_DOMAINS = ""` (every domain-gated integration blocked) and an
idle timeout 3× longer than intended. HTTP 200 throughout, every gate green.

**Both spellings in one payload → the LITERAL key wins, whatever the key order,**
and the loser is reported in `collisions`. Last-write-wins would make the
effective config depend on JSON key order: invisible in a diff, unstable across
whatever wrote the file.

**Say it out loud.** `EnvJsonResult` carries `sourceKeys` (what the file literally
spelled), `renamed` and `collisions`. Print them on both sides:

```js
import { decodeEnvJson, describeEnvJsonKeyChanges } from "@devopsnext/starterkit-config-util/env-json";

const decoded = decodeEnvJson(text);
for (const line of describeEnvJsonKeyChanges(decoded)) console.log(`  · env-json: ${line}`);
```

A normaliser nobody can see in a log is indistinguishable from a payload that
never needed one — and those two states want opposite follow-up actions. Record
`sourceKeys` in whatever file your build bakes, so a diff still answers "which
`env.json` produced this" after the prefix is gone.

`normalizeEnvJsonKeys()` is exported for a consumer that obtains the decoded
object by some other route (a plaintext endpoint, a fixture). You rarely need it —
`decodeEnvJson` already applies it, on the encrypted `configEnv` path *and* the
plaintext `envVariables` path, because those are one file served by two deployment
shapes and must not diverge.

## What must NOT move into the package

| Stays in your repo | Why |
|---|---|
| `env.base.js`, `env.<name>.js` | your keys, your environments (one app has 3, another 5) |
| `derive.js` — the service-path map + default host | one app derives `/landing-user-service`, another `/ai-interview-user-service` plus a `LANDING_DOMAIN_URL` that is not a service |
| every `.env*` file | per-deployment |
| the OAuth **authorize/redirect** URL builders | `redirect_uri` depends on your `BASE_PATH` and on `location.origin` at call time |
| `public/javascript_integration.json` | a MySQL dump Jenkins writes (`create_javascript_integration.py`, a `SELECT *`) — **DevOps-owned data, not ours to move or re-key** |
| the integration source URL, allow-list, `basePath` and enable flag | deployment data; they are arguments to `loadIntegrations`, not config-registry reads |

`derive.js` is the one people try to move, and moving it is worse than duplication:
consumer gates resolve the `...deriveServiceUrls(x)` spread by **parsing that file**
for a returned object **literal** imported from `"./derive"`. Move it and the gate
can no longer name the keys — which is the exact blindness that shipped
`undefined/oauth/authorize` to production. Only `normalizeOrigin()` and (0.4.0+)
`resolveServiceOrigin()` moved — **which origin, never which paths**:

```js
import { normalizeOrigin } from "@devopsnext/starterkit-config-util";
const DEFAULT_SERVICE_URL = "https://nextv3.thinktalent.info";   // stays here

export function deriveServiceUrls(serviceUrl) {
  const origin = normalizeOrigin(serviceUrl, DEFAULT_SERVICE_URL);
  return {                                    // must stay a LITERAL
    SERVICE_URL: origin,
    OAUTH_SERVICE_URL: `${origin}/oauth-service`,
  };
}
```

`normalizeOrigin(undefined, fb)` → `fb`; `normalizeOrigin(null, fb)` → `fb`;
**`normalizeOrigin("", fb)` → `""`**. The empty string is deliberate — setting
`NEXT_PUBLIC_SERVICE_URL=` means root-relative URLs, and collapsing that into the
fallback silently re-targets every API call at the build's default host.

## One build, several hosts — `resolveServiceOrigin` (0.4.0+)

`process.env.NEXT_PUBLIC_SERVICE_URL` is inlined by the compiler, so the host it
names is fixed on the build machine. A static export is then **one artefact served
from several hostnames**, and with `normalizeOrigin` every one of them calls the
host the build named. This shipped: a build carrying `https://nextv3.thinktalent.info`,
served from `323.thinktalent.info`, sent every API call and built every task link
against nextv3. Nothing failed — the page loaded, with another environment's data.

```js
// src/config/derive.js — the import and the one call change; nothing else
import { resolveServiceOrigin } from "@devopsnext/starterkit-config-util";

export function deriveServiceUrls(serviceUrl) {
  const origin = resolveServiceOrigin(serviceUrl, DEFAULT_SERVICE_URL);
  return { SERVICE_URL: origin, OAUTH_SERVICE_URL: `${origin}/oauth-service` };  // still a LITERAL
}
```

| Page is served from | Returns |
|---|---|
| a deployed host | `location.origin`, port included — **the configured value is not consulted at all** |
| loopback: `localhost`, `127.0.0.1`, `[::1]`, `*.localhost` | `normalizeOrigin(value, fallback)`, `""` preserved |
| no `location` — `next build` prerender, SSR, a Node gate | `""` (root-relative) |
| an opaque origin (`"null"`: `file://`, sandboxed iframe, `about:blank`) | `normalizeOrigin(value, fallback)` |

**Which one, decided by one fact about the deployment:**

| Deployment | Use |
|---|---|
| each hostname fronts **its own gateway on the same origin** as the page | `resolveServiceOrigin` |
| the API lives on a **different origin** from the page (CDN-hosted frontend, a shared API host) | `normalizeOrigin` — keep it |

There is no option in between. On a deployed host `resolveServiceOrigin` ignores the
configured value by design, so adopting it where the gateway is cross-origin
re-targets every call at a host that has no API.

**Five things to know before you swap the line.**

1. **The configured value now means "the backend a dev machine talks to".** Setting
   `NEXT_PUBLIC_SERVICE_URL` per environment no longer changes what a deployed page
   calls. Do not "fix" a deployed host by editing it; that host calls itself.
2. **The prerender returns `""`, not the configured value.** Anything computed there
   can land in emitted HTML; root-relative is right on every host the artefact is
   later served from, a named host is right on one. The module is evaluated again in
   the browser, where the real origin replaces it before the first request. So
   emitted HTML showing `/oauth-service/…` with no host is correct, and an
   **absolute** URL you need in static HTML (OG tag, canonical link) cannot come
   from this.
3. **It runs at module scope of your config — the one sanctioned exception to the
   rule below.** It must have run before the first request leaves, which rules out
   an effect. Safe here for the two reasons it usually is not: the `location` read
   is guarded, and the result is computed *by* the client bundle, not serialised
   into it. That exception covers `deriveServiceUrls`, not `getConfig()` reads.
4. **A LAN address is a deployment.** `192.168.1.20` is not loopback, so a phone
   pointed at your laptop's dev server resolves same-origin and finds no gateway.
   Put a proxy in front of the dev server; do not widen `isLoopbackHostname`.
5. **In a test, "no location" is `null`, never `undefined`.** The third argument is a
   `{ hostname, origin }` pair (`Pick<Location, "hostname" | "origin">`), there only so
   a test can supply one — production code passes two arguments. It is a default
   parameter: `undefined` selects `globalThis.location`, and under jsdom that is
   `localhost` — so `resolveServiceOrigin(v, fb, undefined)` silently takes the
   loopback branch and the prerender case is never exercised.

The configured host string is still inlined in the JS bundle (the loopback branch
needs it), so grepping the build output for the build host proves nothing either
way. Verify in a browser, on a second hostname, by watching where requests go.

## Reads happen at CALL TIME. Never at module scope.

```js
// ❌ the value is copied at import time; a post-deploy env.json can never reach it
const secret = getConfig().STORAGE_SECRET;

// ✅
function secret() { return getConfig().STORAGE_SECRET; }
```

This is the one rule whose violation is undetectable at build time. Repo sweeps
for it (`const x = config.Y` at column zero) only walk `src/` — they cannot follow
into `node_modules`, which is why the package enforces it by construction and test.

One exception, and only one: `resolveServiceOrigin` inside `deriveServiceUrls` —
see the section above for why that read is safe and a `getConfig()` read is not.

## Health checks and avatars: `probeFetch`/`getBlob`, never `getJSON`

`authFetch`'s 401 boundary clears the bearer token and redirects to the OAuth
logout. Correct for a real API call by a signed-in user; an outage for anything
else. This already shipped: a briefing page's connection check called
`/actuator/health` through `getJSON`, the gateway answered 401, and a candidate
pressing Start on their emailed link **was signed out by a health check**.

```js
import { probeFetch } from "@/controller/fetch-helpers";     // via your shim
await probeFetch(`${config.SERVICE_URL}/actuator/health`, { timeout: 5000 });
// -> { reached: true, status }  for ANY http status, 401/403/503 included
// -> rejects only on DNS / TLS / offline / timeout
```

`probeFetch` resolving means **bytes came back from that host**, not that the
service is healthy. Surface the status code rather than showing a green tick for a
503. Known limitation: it discards a caller-supplied `signal`, so the request is
not cancellable on unmount.

## Third-party integrations — `./integrations` (0.3.0+)

A DevOps pipeline dumps the `javascript_integration` MySQL table to a static JSON
array, one row per third-party snippet, each carrying raw HTML in
`INTEGRATION_TEXT`. Every app then does the same four things: filter on `STATUS`
and `ALLOWED_DOMAIN`, sort on `INTEGRATION_ORDER`, re-create each `<script>` node,
run them in order. **That is the mechanism, and it now lives in the package.**

> **This executes database-authored JavaScript.** Whoever can write a row runs
> script on every page. Never feed it anything an end user can set, and never serve
> the JSON from an origin a third party can write. `INTEGRATION_TEXT` is
> secret-bearing in practice — live rows embed an AES key as a string literal — so
> **never log, echo or print it.** The result object deliberately returns records the
> caller already handed in, and the extractors return origins, never excerpts.

| You want | Call | Where it runs |
|---|---|---|
| the whole browser flow | `loadIntegrations({ sourceUrl, allowedDomains, host?, signal? })` | browser only |
| just the filter+sort rule | `selectIntegrations(list, { host, allowedDomains })` — **pure**, no DOM, no fetch | anywhere (this is the half the Express `docker/server.js` cheerio interceptors can adopt) |
| the comma-string rule alone | `parseAllowedDomains(value)` | anywhere |
| CSP gate input | `extractIntegrationOrigins(list)` — authoritative | plain Node |
| what that gate cannot see | `extractIntegrationUrlHints(list)` — **advisory, never fail a build on it** | plain Node |

```jsx
// a client component, in an effect — never at module scope, never during prerender
useEffect(() => {
  ensureRuntimeConfig().then(() => {                 // <- the env.json overlay FIRST
    if (!appConfig.INTEGRATIONS_ENABLED) return;
    if (document.documentElement.hasAttribute(ONCE)) return;
    document.documentElement.setAttribute(ONCE, "");  // <- SYNCHRONOUS, before any await

    return loadIntegrations({
      sourceUrl: `${appConfig.BASE_PATH || ""}/javascript_integration.json`,
      allowedDomains: appConfig.INTEGRATION_ALLOWED_DOMAINS || "",
    })
      .then((r) => console.debug(`[integration] ${r.executed} script(s) from ${r.selected.length} record(s)`, r))
      .catch((e) => console.error("[integration] loader failed", e));   // MANDATORY
  });
}, []);
```

**Five things about that snippet are load-bearing.**

1. **Await the `env.json` overlay before calling.** The allow-list is read
   *synchronously, at call time*. Call earlier — from a `<script>` in `<head>`, a
   layout, a parent effect — and you get the build-time list every time and the
   deployed one never, while looking in devtools exactly like a call that worked.
   In deployments where `.env.*` sets no allow-list, `env.json` is its **only**
   source, so "earlier" means "always empty".
2. **The once-guard is written synchronously, before the first `await`, and it lives
   in the DOM.** A guard that awaits first lets both StrictMode invocations through,
   and the symptom is *two Freshworks widgets*, not an error. A module-scope
   `let started = false` does not survive Fast Refresh, which re-evaluates the module.
3. **`.catch()` is mandatory.** `loadIntegrations` **rejects** — a 404 on the JSON,
   an HTTP error, unparseable JSON, a non-array payload — where the
   `public/javascript_integration.js` loaders it replaces swallowed every one into a
   `console.error`. Same contract as `decodeEnvJson`: the library reports, the caller
   decides. Without a `.catch()` it is an unhandled rejection instead of a logged one.
4. **`sourceUrl` is required and your `basePath` is not applied for you.** `document`
   and `fetch` are test seams with sane defaults; if you do pass `fetch`, **bind it** —
   a bare `globalThis.fetch` reference throws `Illegal invocation` in a browser.
5. **Log the result, once.** Before it existed, "did anything run?" was
   unanswerable: an empty table, an allow-list that excluded everything, and a CSP
   that blocked every external script were three different problems that all looked
   identical — silent. `{selected, skipped, executed, failures, aborted}` separates them.

**Selection fails CLOSED, and the exact rules matter:**

- `ALLOWED_DOMAIN: "N"` loads everywhere. `"Y"` loads only on an allow-listed host.
  **Anything else — `"y"`, `""`, `null`, a value a DBA adds next year — is excluded**
  and reported as `unknown-allowed-domain`.
- The host match is `===` against `location.host`, **port included**. `a.example`
  does not match `a.example:3000`, which is why domain-gated rows are dormant under
  a local dev server.
- **Any `%` anywhere voids the entire allow-list.** An unsubstituted
  `%VITE_allowedDomains%` fails to EMPTY rather than to a hostname nobody vetted.
  Pass an array to skip that guard deliberately; a string always goes through it.
- `selectIntegrations` **throws** on a non-array rather than returning `[]` — "the
  file was not what we thought" must not be indistinguishable from "no rows for this host".
- Records run sequentially and external loads are awaited. That ordering *is*
  `INTEGRATION_ORDER`: the row that calls `new SecureLS(...)` is not the row that
  loads secure-ls. Run them concurrently and they fail intermittently.

**Add a CSP gate, and expect it to be red.** `script-src` is maintained by hand;
the table is written by Jenkins; nothing sits between them. When they disagree the
page is HTTP 200, the external scripts are blocked, the **inline** rows still run
(because `'unsafe-inline'` is set) and throw `ReferenceError` on globals the blocked
scripts were meant to define — so the console blames the integration, not the policy.

```js
import { extractIntegrationOrigins, extractIntegrationUrlHints }
  from "@devopsnext/starterkit-config-util/integrations";
```

Three things to get right in that gate:

- **Resolve the directive that actually governs a script element** — `script-src-elem`,
  then `script-src`, then `default-src`. Reading only `script-src` compares against an
  empty list on a policy that uses either of the others and reports every origin as
  missing: a gate lying in the loud direction.
- **A quoted keyword is not an origin.** `'self'`, hashes and nonces must never count
  as permitting a cross-origin `src`, or every real finding goes green.
- **Keep the hints pass.** A row that assigns `r.src = "https://…"` from an inline
  script is invisible to any attribute scan, so without hints the gate goes **green
  the moment the attribute origins are added while that widget stays blocked** — a
  gate certifying the one case it cannot see. Hints warn; they never fail.

If the fix is a human decision (add third-party origins to the CSP, or disable
integrations), mount that gate outside the deploy-path gate set. A gate in the deploy
path that can only ever fail acquires a skip flag, and a skip flag is worse than no gate.

**`DEFAULT_CONFIG_KEYS` is deliberately NOT extended for this.** Every value —
source URL, allow-list, basePath, enable flag — arrives as an argument. One consumer
has no integrations at all, and a required key would make its `check-env-config` gate
demand a value it has no reason to define. That is also what keeps
`selectIntegrations` adoptable by the Express repos.

## ESM-only

No `require()` — **including inside your own gate scripts.** A gate that locates
packages with `createRequire(...).resolve(pkg)` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` against this package, and the error message
typically tells you to run `pnpm install`, which is not the problem. Read
`node_modules/<pkg>/package.json` directly instead.

Read that narrowly. `createRequire` is fine for loading *your own* CommonJS file from
an `.mjs` gate — a CSP gate pulling `infra/security-headers.js` in that way is
correct. What breaks is pointing it at **this** package.

The package ships no CJS build, for two verified reasons: `jose` declares no
`require` condition (so a CJS entry throws `ERR_REQUIRE_ESM`), and tsup does not
code-split CJS, which would give each subpath entry its own copy of the config
registry — the host wiring one object while `./storage` reads another, with a green
build. Consume it from ESM (`.mjs`, `"type": "module"`, or a bundler resolving the
`import` condition).

## Adopting it in a repo that still has local copies

**Full walkthrough with the gate edits: [references/adopting.md](references/adopting.md).**

The step everyone skips: **adopting the package moves config reads out of `src/`,
so your repo's own env-config gate stops seeing them.** Add an assertion that every
name in `DEFAULT_CONFIG_KEYS` is defined by your base env or by every env config,
and one that `index.js` calls `setConfigSource` with the object it exports. Without
them, deleting `STORAGE_SECRET` from `env.base.js` is a green build whose every
decrypt silently fails.

If you also delete a local `public/javascript_integration.js` in favour of
`./integrations`, the same shape applies: the loader's correctness now depends on a
CSP nothing checks. Add the gate in the same commit — see the walkthrough's steps 6 and 7.

## Diagnostics

| Symptom | Most likely cause | Check |
|---|---|---|
| Every user appears signed out; no errors | `setConfigSource` not called, or `STORAGE_SECRET` undefined | `hasConfigSource()`; grep the built chunks for the registry symbol |
| Same, but only after an `env.json` edit | `env.json` set `STORAGE_SECRET`. The storage **re-keys whenever the secret value changes**, so everything written under the old one stops decrypting. This is a behaviour change adoption introduces — the local code most apps had built secure-ls once — and there is no option to opt out. | never put `STORAGE_SECRET` in `env.json`; treat it as build-time only, and assert that in your env.json decode step |
| Login throws at the callback, rather than silently failing | the secret is **missing**, not wrong. `setCookie`/`setLocalStorage` do not swallow. | `hasStorageSecret()` from `…/storage` answers this in one call |
| One key ignores `env.json`; the rest honour it | that key was captured at module scope | move the read inside a function |
| EVERY `env.json` key ignored, and the config object grew keys nobody declared | the payload is in a dialect the decoder does not normalise. `NEXT_PUBLIC_*` is stripped since 0.2.0; `REACT_APP_*` and camelCase are not, by design | `unknownKeys()` names them; `sourceKeys`/`renamed` say what the file spelled |
| `undefined/oauth/authorize` in the built output | an env config is missing a key another defines | your env-config gate, assertions 2/3 |
| A deployed host shows another environment's data; every request 200 | `derive.js` uses `normalizeOrigin`, so the build-time host is baked in for every hostname the artefact is served from | `resolveServiceOrigin` (0.4.0+) — if each host fronts its own same-origin gateway |
| After switching to `resolveServiceOrigin`, API calls fail on the deployed host only | the gateway is on a different origin from the page; the configured value is ignored there by design | go back to `normalizeOrigin` |
| Changing `NEXT_PUBLIC_SERVICE_URL` has no effect on a deployed host | same — with `resolveServiceOrigin` it applies on loopback only | not a bug; the deployed page calls the origin that served it |
| Phone on the LAN hits the dev server and every API call fails | `192.168.x.x` is not loopback, so the app resolves same-origin | put a proxy in front of the dev server that also routes the gateway paths |
| `resolveServiceOrigin` is undefined / not exported | installed version is older than 0.4.0 | check the pin, then the two-step install |
| `ERR_REQUIRE_ESM` | something `require()`d it | ESM-only; use `import` |
| "pressing Start signs me out" | a diagnostic went through `getJSON` | `probeFetch` |
| Build green, every service URL empty | `NEXT_PUBLIC_APP_ENV` names an `Object.prototype` member (`constructor`, `toString`, `__proto__`) | `createAppConfig` throws on these — if it does not, you are not using it |
| Gate says pin/install mismatch | installed in one step (`@latest`, `@^0`, or a bare `pnpm add`) → a range, not a number | look the version up, then re-add it exactly; `--save-exact` if the client still widens |
| Release-age gate fails on an entry you did not write | pnpm auto-appended it without a marker | add `# published <ISO8601>`, or delete it once the window passed |
| A widget never appears; `loadIntegrations` resolved, no error | read the result — `skipped: domain-not-allowed` (host mismatch, **port counts**), `unknown-allowed-domain` (column is not `"Y"`/`"N"`), or `allowedDomains: []` | if the list is empty: a `%` voided it, **or** you called before the `env.json` overlay applied |
| `executed` is non-zero, `failures` is non-empty | the scripts were appended and the browser refused them — almost always a `script-src` missing the origin | `extractIntegrationOrigins`; check the console for the CSP violation |
| Two widgets / two onboarding tours, dev only | StrictMode double-invoke past a once-guard that awaited first, or a module flag Fast Refresh reset | write the guard synchronously, into the DOM |
| `loadIntegrations: no document` | called at module scope or during prerender | call it from an effect; for the rule alone use `selectIntegrations` |
| `TypeError: Illegal invocation` on the fetch | an unbound `fetch` was passed via `options.fetch` | pass `globalThis.fetch.bind(globalThis)`, or omit it |
| CSP gate is green but one widget is still blocked | that row assigns `.src` from an inline script — invisible to any attribute scan | `extractIntegrationUrlHints`; never drop that pass |

## Red flags — stop

- About to move `deriveServiceUrls` into the package → **don't**; only `normalizeOrigin` and `resolveServiceOrigin` are shared — which origin, never which paths.
- About to hand-roll `typeof window !== "undefined" ? location.origin : env.SERVICE_URL` in `derive.js` → **`resolveServiceOrigin`**; the hand-rolled one bakes a host into the prerender, breaks localhost, and composes `null/…` under an opaque origin.
- About to swap `normalizeOrigin` for `resolveServiceOrigin` without knowing whether the gateway is same-origin → find out first; on a cross-origin API it ignores your configured host.
- About to call `resolveServiceOrigin` from an effect or per request → it belongs at module scope of the config, before the first request.
- About to add a LAN range to a local copy of `isLoopbackHostname` → a host behind a private load balancer looks identical, and getting that one wrong is an outage.
- About to write `const secret = getConfig().X` at module scope → **don't**.
- About to reach for `getJSON` for a health check, avatar or any diagnostic → **`probeFetch`/`getBlob`**.
- About to delete the `hasConfigSource()` throw as redundant → it is the only thing making a missing wire-up fail the build.
- About to run `pnpm add …@latest`, `@^0`, `@~0.1` or a bare `pnpm add <pkg>` →
  all of them record a **range**. Look the latest version up, then install that
  literal number.
- `package.json` shows `"^0.4.0"` rather than `"0.4.0"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry →
  check first; latest may have moved past 0.4.0.
- About to write a host-side `NEXT_PUBLIC_` stripper for `env.json` → **don't**; `decodeEnvJson` does it since 0.2.0, and an app-side copy has to be wired into *both* decode sites or the baked and deployed values silently disagree.
- About to "fix" `env.json` by re-keying it → that file is usually **DevOps-owned**. Check who writes it before editing; the decoder is the side that adapts.
- About to call `loadIntegrations` without a `.catch()` → it **rejects**; that is an unhandled rejection.
- About to call it before the `env.json` overlay resolves → the allow-list is read synchronously, so you get the build-time value forever.
- About to write the once-guard after an `await`, or as a module-scope `let` → StrictMode and Fast Refresh both defeat that. Synchronous, in the DOM.
- About to log, print or diff `INTEGRATION_TEXT` → **don't**; live rows embed an AES key as a literal. Log origins and skip reasons.
- About to hand `loadIntegrations` a source URL an end user can influence, or serve the JSON from a writable origin → that is arbitrary script execution on every page.
- About to drop `extractIntegrationUrlHints` from a CSP gate because it is noisy → it is the only pass that can see a runtime-assigned `.src`. Without it the gate goes green on the one integration that is actually broken.
- About to add `INTEGRATION_*` to `DEFAULT_CONFIG_KEYS` or read them from the registry inside the package → **don't**; they are arguments, and a consumer with no integrations must not be forced to define them.
- About to reintroduce `window.INTEGRATION_SOURCE_URL` / `window.INTEGRATION_ALLOWED_DOMAINS` → those globals only existed to feed a classic `<script>`; they are parameters now.
- Gate output says `LOCAL BUILD — pin NOT enforced` → you are on a `file:` tarball; that must never reach a shared branch.
