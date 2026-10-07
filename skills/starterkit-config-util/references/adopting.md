# Adopting @devopsnext/starterkit-config-util in a repo with local copies

Ordered so that each step is independently revertible and the gates stay meaningful
throughout. Do it on a branch.

## 0. Inventory what you are replacing

```bash
ls src/config/                 # index.js, derive.js, env.base.js, env.<name>.js …
ls src/api src/controller      # ApiUtils, fetch-helpers, envBoolean, payload-service
ls public/                     # javascript_integration.js (goes) + .json (stays)
grep -rn "getEnvBoolean\|parseBoolean\|decodeEnvJson\|deriveServiceUrls" src/ scripts/
```

Sort them into **mechanism** (goes) and **data** (stays):

| Goes | Stays |
|---|---|
| the `ENV_CONFIGS[appEnv]` resolution + spread | `env.base.js` |
| `ApiUtils` / secure-ls wrapper | `env.<name>.js` (all of them) |
| `fetch-helpers` / auth fetch | `derive.js` — the service-path map and default host |
| `envBoolean` (`parseBoolean`/`getEnvBoolean`/`parseNumber`) | every `.env*` |
| `env-json.mjs` decoder — **including any local `NEXT_PUBLIC_` key handling** | OAuth authorize/redirect URL builders |
| `payload-service` | any app-specific storage-key constants |
| `public/javascript_integration.js` — the fetch/filter/sort/inject loader | `public/javascript_integration.json` — a Jenkins-written MySQL dump, **DevOps-owned** |
| a `docker/server.js` cheerio `interceptor` block (the same rule, server-side) | the allow-list env var, whatever your app spells it |

The `.js`/`.json` pair in `public/` catches people out. Only one of them is yours:
the `.json` is generated (`cd public && python3 create_javascript_integration.py`),
the `.js` never was — it is app code that happens to live in `public/`, hand-ported
between apps, and it has probably already drifted from the copy it came from.

## 1. Install, exact

```bash
npm view @devopsnext/starterkit-config-util version
pnpm add @devopsnext/starterkit-config-util@<that version>
```

The version is also on the package page if you'd rather read it there:
<https://www.npmjs.com/package/@devopsnext/starterkit-config-util>

Then confirm `package.json` holds the bare number, not `"^<that version>"`.

Already installed with a caret by mistake? `pnpm remove` first, then re-add with
the exact version, rather than assuming `pnpm add` rewrites the existing spec.

Then **check what pnpm did to your workspace file**:

```bash
git diff pnpm-workspace.yaml
```

**If your repo sets no `minimumReleaseAge`, skip the rest of this step** — pnpm
appends nothing and there is nothing to mark. Do not invent an entry.

Otherwise: the entry only gets auto-written because `minimumReleaseAgeStrict: true`
is missing. **Fix the flag as well as the entry**, or pnpm silently re-appends on
the next same-day adoption:

```yaml
minimumReleaseAge: 1440
minimumReleaseAgeStrict: true
```

Then repair the entry — and pick the right repair. If the window has **already
passed**, adding a marker fails as EXPIRED; *delete the line* instead. If it is
still open, rewrite it with a marker your gate can parse and a comment saying it
is a bridge:

```yaml
minimumReleaseAgeExclude:
  # Bridge, not a setting. Delete once the window passes — by then the package
  # installs on its own age, so removing this cannot break resolution.
  - '@devopsnext/starterkit-config-util@0.4.0' # published 2026-10-07T08:59:34Z
```

`npm view <pkg> time --json` gives the real timestamp. Never `time.<version>` —
npm splits on `.` and silently returns nothing.

## 2. `derive.js` — one import line changes, nothing else

Keep the whole file. Replace only the trailing-slash normalisation:

```js
import { normalizeOrigin } from "@devopsnext/starterkit-config-util";

const DEFAULT_SERVICE_URL = "https://nextv3.thinktalent.info";

export function deriveServiceUrls(serviceUrl) {
  const origin = normalizeOrigin(serviceUrl, DEFAULT_SERVICE_URL);
  return { /* your literal map, unchanged */ };
}
```

The returned object must stay a **literal with literal keys**, and env files must
keep importing it from `"./derive"`. Consumer gates parse both facts.

Behaviour change worth knowing: the old `serviceUrl = DEFAULT` default parameter
applied only to `undefined`, so `deriveServiceUrls(null)` composed `"null/oauth-service"`.
`normalizeOrigin` folds `null` in with `undefined` and still leaves `""` alone.

**Is one build served from more than one hostname?** Decide it here, because it is
the same line. If each hostname fronts its own gateway on the same origin as the
page, use `resolveServiceOrigin` (0.4.0+) instead — identical arguments:

```js
const origin = resolveServiceOrigin(serviceUrl, DEFAULT_SERVICE_URL);
// deployed host -> location.origin   localhost -> the configured value   prerender -> ""
```

With `normalizeOrigin`, every hostname calls the host the build named, at HTTP 200,
with that environment's data. With `resolveServiceOrigin` the configured value
becomes "the backend a dev machine talks to" and is ignored on a deployed host —
so **do not use it if the API is on a different origin from the page**.

Land that swap as its own commit, after the extraction is verified. It changes which
host every request goes to, and step 3's rule applies: a behaviour change and an
extraction in one commit make a regression unattributable.

## 3. `index.js` — thin

```js
import { createAppConfig, hasConfigSource, setConfigSource } from "@devopsnext/starterkit-config-util";
// … your static env imports …

const ENV_CONFIGS = { dev: devEnv, test: testEnv /* … */ };   // keep it a literal

const config = createAppConfig({
  base: baseEnv,
  envs: ENV_CONFIGS,
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || "dev",
  overrides: envJsonSnapshot?.overrides,   // omit entirely if you have no env.json layer
});

setConfigSource(config, {
  mirrorRaw: true,                                  // only if you already wrote "<key>_raw" mirrors
  decompressOverrideKey: "VITE_RESPONSE_DECOMPRESS", // only if that is your sessionStorage key
  payloadOnlyDecompress: false,                     // see the derivation table below
});
if (!hasConfigSource()) throw new Error("src/config: setConfigSource() did not take.");

export default config;
```

Set the three options **to match what your app did before**, not to the package
defaults. Changing behaviour and extracting code in the same commit makes a
regression unattributable.

**How to derive `payloadOnlyDecompress`** — read your old `authFetch`, find the
branch taken when the decompress flag is ON, and ask what it does with a response
whose ONLY key is `payload`:

| Your old code, flag ON | Pass |
|---|---|
| decompresses a lone `{payload}`, returns multi-key responses untouched | `true` (default) |
| returns `checked` untouched no matter what | `false` |

**One behaviour change you cannot opt out of:** the package rebuilds secure-ls
whenever the secret *value* changes, where most local copies built it once. If a
runtime `env.json` ever sets `STORAGE_SECRET`, everything written under the old
value stops decrypting and every user appears signed out. Keep that key
build-time-only.

## 4. Shims, not 20 rewritten imports

```js
// src/api/ApiUtils.jsx  (or src/controller/ApiUtils.jsx)
import "@/config";   // load-bearing: guarantees setConfigSource() ran first
export { default, createApiUtils, encodeJwtString, decodeJwtString }
  from "@devopsnext/starterkit-config-util/storage";
```

Same for `fetch-helpers`. Two reasons this beats repointing every call site: zero
churn, and the bare `import "@/config"` pins module evaluation order.

**Delete rather than shim anything whose only importer was another shim** — a
local `envBoolean` usually has exactly one consumer (`fetch-helpers`), so once that
is a shim the file has no importers left.

## 5. Repoint the decoder's other callers

```bash
grep -rn "config/env-json" src/ scripts/
```

Both a build script and a browser module usually import it. Point both at
`@devopsnext/starterkit-config-util/env-json` and delete the local copy — one
decoder, so the baked values and the fetched values cannot disagree.

**This step CHANGES BEHAVIOUR if your `env.json` is written in `.env` dialect.**
Since 0.2.0 `decodeEnvJson()` strips a leading `NEXT_PUBLIC_` off every key, so a
payload of `NEXT_PUBLIC_IDLE_TIME` starts resolving to `appConfig.IDLE_TIME` —
which is almost always the fix, since those keys were previously landing under
names nothing read. Check what yours actually contains before and after:

```bash
node -e "import('@devopsnext/starterkit-config-util/env-json').then(async m=>{
  const fs=await import('node:fs');
  const r=m.decodeEnvJson(fs.readFileSync('public/env.json','utf8'));
  console.log(r.keys, r.sourceKeys, r.renamed, r.collisions);
})"
```

Two consequences worth stating before you land it:

- A key that was **silently ignored** starts taking effect. That is the point, and
  it is still a config change — read the values, do not assume they match your
  build-time defaults.
- **Do not write a host-side stripper as part of this step.** The package does it
  on both decode paths. An app-side copy has to be wired into the build script
  *and* the browser module, and wiring only one produces a build whose baked and
  deployed values disagree with no error — the exact failure a single shared
  decoder exists to prevent.

`sourceKeys` is worth recording in whatever file your build bakes, so a diff still
answers "which `env.json` produced this" once the prefix is gone.

## 6. The integration loader — only if you have one

Skip this if `public/javascript_integration.js` (or a `docker/server.js` cheerio
`interceptor`) does not exist in your repo. If it does, delete the `.js`, keep the
`.json`, and call the package from a client component instead:

```jsx
import { loadIntegrations } from "@devopsnext/starterkit-config-util/integrations";

useEffect(() => {
  ensureRuntimeConfig().then(() => {                    // 1. overlay FIRST
    if (!appConfig.INTEGRATIONS_ENABLED) return;
    if (document.documentElement.hasAttribute(ONCE)) return;
    document.documentElement.setAttribute(ONCE, "");    // 2. guard, SYNCHRONOUSLY
    return loadIntegrations({
      sourceUrl: `${appConfig.BASE_PATH || ""}/javascript_integration.json`,
      allowedDomains: appConfig.INTEGRATION_ALLOWED_DOMAINS || "",
    })
      .then((r) => console.debug(`[integration] ${r.executed} script(s) from ${r.selected.length} record(s)`, r))
      .catch((e) => console.error("[integration] loader failed", e));   // 3. MANDATORY
  });
}, []);
```

**Four things change, and three of them are silent if you get them wrong.**

- **The allow-list is read synchronously at call time**, and on most deployments
  `env.json` is its only source — `.env.test` / `.env.think` typically set it
  nowhere. Await the overlay or you get the build-time value forever, while devtools
  shows a call that looks like it worked.
- **The once-guard moves out of the `<script id="…">` tag you just deleted.** Write
  it into the DOM, synchronously, before the first `await`. Awaiting first lets both
  StrictMode invocations through and you get two widgets, not an error; a
  module-scope `let` does not survive Fast Refresh.
- **It rejects.** The old loader swallowed a missing file, an HTTP error and a
  non-array payload into `console.error`. `.catch()` is not optional now.
- **Any `window.INTEGRATION_*` globals go away.** They only existed to hand values
  to a classic `<script>`; they are arguments. That is also one fewer HTTP request.

No teardown. The injected scripts define globals, mount iframes and register
listeners; removing a `<script>` element undoes none of it, so a cleanup would be
theatre. The once-guard is what makes the double-invoke safe.

Porting a server-side `interceptor` instead? Take `selectIntegrations` — it is pure,
it is the whole rule those copies implement by hand, and it pulls no peer dependency.

## 7. THE STEP EVERYONE SKIPS — restore the gate coverage you just lost

Your env-config gate asserts "every `config.KEY` read in `src/` is defined". After
step 4 the reads live in `node_modules`, where it cannot follow. Two assertions
replace what was lost:

```js
import { DEFAULT_CONFIG_KEYS } from "@devopsnext/starterkit-config-util";

// A) every key the package reads must be defined by this repo
for (const [role, key] of Object.entries(DEFAULT_CONFIG_KEYS)) {
  if (!defined.has(key)) {
    fail(`config.${key} is read by the package (as its "${role}") but nothing here defines it.`);
  }
}

// B) index.js must actually wire the package, with the object it exports
const ast = parseModule(INDEX);
const exported = defaultExportIdentifier(ast);
let wired = null;
for (const node of ast.program.body) {
  const call = node.type === "ExpressionStatement" ? node.expression : null;
  if (call?.type === "CallExpression" && call.callee?.name === "setConfigSource") {
    wired = call.arguments[0]?.type === "Identifier" ? call.arguments[0].name : "(not an identifier)";
  }
}
if (!wired) fail("index.js never calls setConfigSource() at the top level.");
else if (exported && wired !== exported) fail(`calls setConfigSource(${wired}) but exports \`${exported}\`.`);
```

If you remapped key names via `setConfigSource(config, { keys: … })`, assert the
remapped set instead of the defaults.

**Also add a row to whatever gate enforces your exact version pins.** If that gate
requires a `styles.css` per package, scope the requirement to packages that declare
a CSS alias prefix — this one correctly ships no CSS. A row shaped like:

```js
{ name: "config-util", pkg: "@devopsnext/starterkit-config-util", alias: null,
  why: "ships no CSS - config/storage/fetch mechanism, so only the pin applies" },
```

**Do not locate the package with `createRequire(...).resolve(pkg)`.** It throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` on an ESM-only package, and the error usually
advises running `pnpm install`, which is not the problem. Read
`node_modules/<pkg>/package.json` directly. (`createRequire` for one of *your own*
CommonJS files — a security-headers module, say — is fine; it is pointing it at this
package that breaks.)

**If you did step 6, add a CSP gate too.** `script-src` is maintained by hand and
the integration table is written by Jenkins, with nothing between them. Disagreement
is HTTP 200: externals blocked, inline rows still running under `'unsafe-inline'`,
then `ReferenceError` on a global — a console that blames the integration, not the
policy.

```js
import { extractIntegrationOrigins, extractIntegrationUrlHints }
  from "@devopsnext/starterkit-config-util/integrations";
// resolve the governing directive in this order: script-src-elem, script-src, default-src.
// origins  -> fail    hints -> warn only, never fail
```

Three ways to get that gate wrong:

- **Reading only `script-src`.** On a policy that uses `script-src-elem` or falls
  back to `default-src` you compare against an empty list and report every origin as
  missing — a gate lying in the loud direction, which is how allow-list bolt-ons
  get added.
- **Treating `'self'` (or any quoted keyword, hash or nonce) as satisfying a
  cross-origin `src`.** That turns every real finding green.
- **Dropping the hints pass because it is noisy.** A row that assigns
  `r.src = "https://…"` from an inline script is invisible to any attribute scan, so
  without hints the gate goes green the moment the attribute origins are added while
  that widget stays blocked.

**Print nothing from `INTEGRATION_TEXT`** — live rows embed an AES key as a literal.
Origins and record labels are safe; the text is not.

**Expect this gate to be red on the day you add it, and mount it accordingly.** Its
fix — widen the CSP, or turn integrations off — is a human decision no build can
make. Put it where a person sees it (a local `prebuild`), not in the deploy-path gate
set, where a permanently-red gate earns itself a skip flag. State the cost out loud
in the script: deploy builds keep shipping that CSP and this gate will not stop them.

## 8. Prove the new assertions can fail

An assertion nobody has watched fail is decoration. Run each, confirm it fires,
revert:

1. Delete `STORAGE_SECRET` from `env.base.js` → assertion A must fail naming it.
2. Comment out the `setConfigSource(…)` call → assertion B must fail.
3. Set `NEXT_PUBLIC_APP_ENV=constructor` and build → must fail naming the value and
   the known environments. (Before adoption this built green with empty service URLs.)
4. If you added the CSP gate: remove one third-party origin from `script-src` → it
   must fail naming that origin and the rows that load it.
5. If you switched to `resolveServiceOrigin`: point `NEXT_PUBLIC_SERVICE_URL` at a
   host that does not exist, build, and serve the output from a non-loopback
   hostname → every request must still go to the serving origin. On `localhost` the
   same build must try the bogus host and fail. (A unit test of the no-location case
   passes `null` — `undefined` selects jsdom's `localhost`.)

## 9. Verify

```bash
pnpm <your gate script>
# build EVERY environment, not just dev — the whole point is that they resolve identically
pnpm build && pnpm build:test && pnpm build:think
grep -rl "undefined/oauth\|undefined/rest" out/ | head    # must be empty
```

Then a real authenticated run. Unit tests cannot show that AES storage and the auth
fetch path work end to end; a login can. Watch for zero 401s — and if you reuse a
saved session, remember an expired token 401s for reasons that have nothing to do
with your change.

**If you switched to `resolveServiceOrigin`, do that run on a second hostname.** The
bug it fixes is invisible on the host the build named, and invisible to `grep` — the
configured host is still inlined for the loopback branch. Only the network panel on a
*different* host shows where requests go. Emitted HTML carrying root-relative service
URLs is correct: the prerender has no location and deliberately names no host.

**If you did step 6, that run has to cover the integrations too — in a real browser,
because nothing else can.** Confirm the export emits the `.json` and no `.js`; then
check the count of scripts and records against the table and their order, that
reloading under StrictMode produces no duplicates, that the globals the rows define
exist, that any legacy `window.INTEGRATION_*` is now `undefined`, and that a
domain-gated row does **not** run on a non-allow-listed host. One row's external
genuinely 404ing while the rest still run is the correct behaviour, not a failure.

## 10. Do not skip

- The exact pin. A caret lets a minor bump change how every API response is parsed.
- Deleting the release-age bridge once its window passes.
- Recording, in your repo's instruction file, *why* `derive.js` and `env.base.js`
  stayed — otherwise the next person "finishes the job" and moves them.
- The `.catch()` on `loadIntegrations`, and the reason the once-guard is written
  before the first `await`. Both look removable and neither is.
