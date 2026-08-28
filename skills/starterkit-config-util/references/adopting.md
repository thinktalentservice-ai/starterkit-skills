# Adopting @devopsnext/starterkit-config-util in a repo with local copies

Ordered so that each step is independently revertible and the gates stay meaningful
throughout. Do it on a branch.

## 0. Inventory what you are replacing

```bash
ls src/config/                 # index.js, derive.js, env.base.js, env.<name>.js …
ls src/api src/controller      # ApiUtils, fetch-helpers, envBoolean, payload-service
grep -rn "getEnvBoolean\|parseBoolean\|decodeEnvJson\|deriveServiceUrls" src/ scripts/
```

Sort them into **mechanism** (goes) and **data** (stays):

| Goes | Stays |
|---|---|
| the `ENV_CONFIGS[appEnv]` resolution + spread | `env.base.js` |
| `ApiUtils` / secure-ls wrapper | `env.<name>.js` (all of them) |
| `fetch-helpers` / auth fetch | `derive.js` — the service-path map and default host |
| `envBoolean` (`parseBoolean`/`getEnvBoolean`/`parseNumber`) | every `.env*` |
| `env-json.mjs` decoder | OAuth authorize/redirect URL builders |
| `payload-service` | any app-specific storage-key constants |

## 1. Install, exact

```bash
npm view @devopsnext/starterkit-config-util version
pnpm add @devopsnext/starterkit-config-util@<that version>
```

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
  - '@devopsnext/starterkit-config-util@0.1.0' # published 2026-08-28T18:27:37Z
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
  payloadOnlyDecompress: false,                     // only if your app returned `checked` untouched
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

## 6. THE STEP EVERYONE SKIPS — restore the gate coverage you just lost

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
`node_modules/<pkg>/package.json` directly.

## 7. Prove the new assertions can fail

An assertion nobody has watched fail is decoration. Run each, confirm it fires,
revert:

1. Delete `STORAGE_SECRET` from `env.base.js` → assertion A must fail naming it.
2. Comment out the `setConfigSource(…)` call → assertion B must fail.
3. Set `NEXT_PUBLIC_APP_ENV=constructor` and build → must fail naming the value and
   the known environments. (Before adoption this built green with empty service URLs.)

## 8. Verify

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

## 9. Do not skip

- The exact pin. A caret lets a minor bump change how every API response is parsed.
- Deleting the release-age bridge once its window passes.
- Recording, in your repo's instruction file, *why* `derive.js` and `env.base.js`
  stayed — otherwise the next person "finishes the job" and moves them.
