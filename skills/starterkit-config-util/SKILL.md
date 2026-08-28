---
name: starterkit-config-util
description: Use when adopting, wiring, debugging or extending @devopsnext/starterkit-config-util in a Think Talent frontend — installing or pinning it, writing or editing src/config/index.js, derive.js or env.base.js, reading a config key such as STORAGE_SECRET or OAUTH_SERVICE_URL, adding a health check or connectivity probe, or diagnosing symptoms like "every user appears signed out", "the login page redirects to undefined/oauth/authorize", "env.json overrides are ignored", "ERR_REQUIRE_ESM", or a green build whose service URLs are empty.
license: MIT
compatibility: Requires pnpm 9+ and a Node 18+ frontend that consumes @devopsnext/starterkit-config-util. Some checks reference repo-local gate scripts under scripts/.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-config-util

`@devopsnext/starterkit-config-util` owns app-config resolution, AES browser storage
and the authenticated fetch layer for the Think Talent frontends. It exists because
three apps carried byte-identical copies of the same ~140 lines and drifted.

**The core principle, and everything below follows from it:**

> The package owns MECHANISM. Your repo owns DATA. Every failure mode in this
> document is someone moving one across that line — or the package reading a
> value the repo stopped defining, in a place no gate can see.

## Read this first: three failure modes that produce a GREEN BUILD

The package's own README explains the API well. What it cannot tell you is which
mistakes are silent. These three are, and each has a specific counter below.

| Symptom | Cause | Counter |
|---|---|---|
| Every user appears signed out. **No console error at all.** Build green. | The secret is *wrong or changed*, not missing — writes succeed, reads fail, and reads swallow. | never let `env.json` set `STORAGE_SECRET`; see Diagnostics |
| Login dies at the callback with a thrown error. | The secret is *missing*. **Writes do not swallow** — `setCookie`/`setLocalStorage` let `assertSecret` throw. | `hasConfigSource()` self-check + gate assertions |
| One config key ignores a post-deploy `env.json` while every other key honours it. | Something captured that value at module scope. | Read inside the function, never at module scope |
| Login redirects to `undefined/oauth/authorize?…`. All routes prerendered. | An env config is missing a key another env defines. | The consumer's env-config gate, kept intact |

## Quick reference — entries

| Import | Gives you | Peers pulled |
|---|---|---|
| `@devopsnext/starterkit-config-util` | `normalizeOrigin`, `createAppConfig`, `setConfigSource`, `getConfig`, `hasConfigSource`, `requiredConfigKeys`, `DEFAULT_CONFIG_KEYS`, `parseBoolean`, `getEnvBoolean`, `parseNumber` | **none** |
| `…/env-json` | `decodeEnvJson`, `unknownKeys` | react-security-util |
| `…/storage` | `ApiUtils` (default), `createApiUtils`, `encodeJwtString`, `decodeJwtString`, `hasStorageSecret` | jose, secure-ls, react-security-util |
| `…/fetch` | `authFetch`, `getJSON`, `postJSON`, `putJSON`, `deleteJSON`, `postFormData`, `postBinary`, `getBlob`, `probeFetch`, `authHeaders`, `getToken`, `createFetchHelpers` | via `…/storage` |
| `…/payload` | `buildCompressedPayload` | react-security-util |

Import the **narrowest** entry. The `.` entry is zero-dependency on purpose — a
route that only wants `parseBoolean` must not pull `jose` and `secure-ls` into
its bundle.

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

At the time this file was written step 1 answered `0.1.0`, so step 2 was
`pnpm add @devopsnext/starterkit-config-util@0.1.0`.

`package.json` must end up holding the bare number —
`"@devopsnext/starterkit-config-util": "0.1.0"`. **Open it and check.**

**Trap 1 — a one-step install records a range.** Measured against pnpm 11.11.0 on
a clean project:

| Command | Writes |
|---|---|
| `pnpm add …-config-util@0.1.0` | `"0.1.0"` ✅ exact |
| `pnpm add …-config-util@latest` | `"^0.1.0"` ❌ caret |

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
  - '@devopsnext/starterkit-config-util@0.1.0'      # <- no marker, no reason
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
  - '@devopsnext/starterkit-config-util@0.1.0' # published 2026-08-28T18:27:37Z
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

## What must NOT move into the package

| Stays in your repo | Why |
|---|---|
| `env.base.js`, `env.<name>.js` | your keys, your environments (one app has 3, another 5) |
| `derive.js` — the service-path map + default host | one app derives `/landing-user-service`, another `/ai-interview-user-service` plus a `LANDING_DOMAIN_URL` that is not a service |
| every `.env*` file | per-deployment |
| the OAuth **authorize/redirect** URL builders | `redirect_uri` depends on your `BASE_PATH` and on `location.origin` at call time |

`derive.js` is the one people try to move, and moving it is worse than duplication:
consumer gates resolve the `...deriveServiceUrls(x)` spread by **parsing that file**
for a returned object **literal** imported from `"./derive"`. Move it and the gate
can no longer name the keys — which is the exact blindness that shipped
`undefined/oauth/authorize` to production. Only `normalizeOrigin()` moved:

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

## ESM-only

No `require()` — **including inside your own gate scripts.** A gate that locates
packages with `createRequire(...).resolve(pkg)` throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` against this package, and the error message
typically tells you to run `pnpm install`, which is not the problem. Read
`node_modules/<pkg>/package.json` directly instead. The package ships no CJS build, for two verified reasons: `jose`
declares no `require` condition (so a CJS entry throws `ERR_REQUIRE_ESM`), and
tsup does not code-split CJS, which would give each subpath entry its own copy of
the config registry — the host wiring one object while `./storage` reads another,
with a green build. Consume it from ESM (`.mjs`, `"type": "module"`, or a bundler
resolving the `import` condition).

## Adopting it in a repo that still has local copies

**Full walkthrough with the gate edits: [references/adopting.md](references/adopting.md).**

The step everyone skips: **adopting the package moves config reads out of `src/`,
so your repo's own env-config gate stops seeing them.** Add an assertion that every
name in `DEFAULT_CONFIG_KEYS` is defined by your base env or by every env config,
and one that `index.js` calls `setConfigSource` with the object it exports. Without
them, deleting `STORAGE_SECRET` from `env.base.js` is a green build whose every
decrypt silently fails.

## Diagnostics

| Symptom | Most likely cause | Check |
|---|---|---|
| Every user appears signed out; no errors | `setConfigSource` not called, or `STORAGE_SECRET` undefined | `hasConfigSource()`; grep the built chunks for the registry symbol |
| Same, but only after an `env.json` edit | `env.json` set `STORAGE_SECRET`. The storage **re-keys whenever the secret value changes**, so everything written under the old one stops decrypting. This is a behaviour change adoption introduces — the local code most apps had built secure-ls once — and there is no option to opt out. | never put `STORAGE_SECRET` in `env.json`; treat it as build-time only, and assert that in your env.json decode step |
| Login throws at the callback, rather than silently failing | the secret is **missing**, not wrong. `setCookie`/`setLocalStorage` do not swallow. | `hasStorageSecret()` from `…/storage` answers this in one call |
| One key ignores `env.json`; the rest honour it | that key was captured at module scope | move the read inside a function |
| `undefined/oauth/authorize` in the built output | an env config is missing a key another defines | your env-config gate, assertions 2/3 |
| `ERR_REQUIRE_ESM` | something `require()`d it | ESM-only; use `import` |
| "pressing Start signs me out" | a diagnostic went through `getJSON` | `probeFetch` |
| Build green, every service URL empty | `NEXT_PUBLIC_APP_ENV` names an `Object.prototype` member (`constructor`, `toString`, `__proto__`) | `createAppConfig` throws on these — if it does not, you are not using it |
| Gate says pin/install mismatch | installed in one step (`@latest`, `@^0`, or a bare `pnpm add`) → a range, not a number | look the version up, then re-add it exactly; `--save-exact` if the client still widens |
| Release-age gate fails on an entry you did not write | pnpm auto-appended it without a marker | add `# published <ISO8601>`, or delete it once the window passed |

## Red flags — stop

- About to move `deriveServiceUrls` into the package → **don't**; only `normalizeOrigin` is shared.
- About to write `const secret = getConfig().X` at module scope → **don't**.
- About to reach for `getJSON` for a health check, avatar or any diagnostic → **`probeFetch`/`getBlob`**.
- About to delete the `hasConfigSource()` throw as redundant → it is the only thing making a missing wire-up fail the build.
- About to run `pnpm add …@latest`, `@^0`, `@~0.1` or a bare `pnpm add <pkg>` →
  all of them record a **range**. Look the latest version up, then install that
  literal number.
- `package.json` shows `"^0.1.0"` rather than `"0.1.0"` → re-add with `--save-exact`.
- About to install the version this file names without re-checking the registry →
  check first; latest may have moved past 0.1.0.
- Gate output says `LOCAL BUILD — pin NOT enforced` → you are on a `file:` tarball; that must never reach a shared branch.
