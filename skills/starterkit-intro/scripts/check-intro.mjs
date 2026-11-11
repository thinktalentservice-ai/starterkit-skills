#!/usr/bin/env node
/**
 * check-intro.mjs — static gate for the per-page intro files of
 * @devopsnext/starterkit-intro. Copied into a project by setup-intro.mjs.
 *
 *   node scripts/check-intro.mjs
 *   node scripts/check-intro.mjs --intro-dir public/intro --src src --app-dir src/app
 *   node scripts/check-intro.mjs --app-dir none          # not a Next App Router app
 *
 * Every way an intro file can be wrong is SILENT in the browser by design — the
 * package never throws into the host tree, so a bad file just means a shorter
 * tour or no tour:
 *
 *   - a schema error (typo'd key, empty body)          → console.warn, no tour
 *   - a file whose `route` disagrees with its path      → ignored
 *   - a file for a route whose page was deleted         → dead weight
 *   - a step aimed at a data-intro key renamed in JSX   → step skipped, tour shorter
 *   - a non-data-intro target that is not `optional`    → nobody can check it
 *
 * This turns all five into a failing exit code, with no server and no browser.
 * Validation is the PACKAGE'S validateIntro (its ./schema entry), never a copy,
 * so this gate and the runtime cannot disagree about what a legal file is.
 *
 * BLIND SPOTS, printed rather than hidden:
 *   - a target that is not `[data-intro="…"]` (a layout landmark such as
 *     `.il-sidebar`) lives in someone else's markup and is not checkable here;
 *     it must be `optional` so a rename skips it instead of breaking the tour;
 *   - a data-intro key built at runtime (template literal with ${}, variable)
 *     is invisible to the source scan and fails as "no element carries that key".
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { validateIntro, routeToIntroPath } from "@devopsnext/starterkit-intro/schema";

const { values } = parseArgs({
    options: {
        "intro-dir": { type: "string", default: "public/intro" },
        src: { type: "string", default: "src" },
        "app-dir": { type: "string" },
    },
});

const ROOT = process.cwd();
const INTRO_DIR = path.resolve(ROOT, values["intro-dir"]);
const SRC_DIR = path.resolve(ROOT, values.src);

/* The App Router directory, if there is one. `--app-dir none` turns the
   route-existence check off for any other router; it is reported, not silent. */
let APP_DIR = null;
if (values["app-dir"] && values["app-dir"] !== "none") APP_DIR = path.resolve(ROOT, values["app-dir"]);
else if (values["app-dir"] !== "none") {
    APP_DIR = ["src/app", "app"].map((d) => path.join(ROOT, d)).find((d) => existsSync(d)) ?? null;
}

const errors = [];
const warnings = [];
const posix = (p) => p.split(path.sep).join("/");

function walk(dir, keep) {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
            out.push(...walk(p, keep));
        } else if (keep(entry.name)) out.push(p);
    }
    return out;
}

if (!existsSync(INTRO_DIR) || !statSync(INTRO_DIR).isDirectory()) {
    console.log(`✓ lint:intro — no ${posix(path.relative(ROOT, INTRO_DIR))}/ directory, nothing to check`);
    process.exit(0);
}
if (!existsSync(SRC_DIR)) {
    console.error(`✖ lint:intro — source directory ${values.src} not found (pass --src)`);
    process.exit(1);
}

/* Routes that exist: App Router page files, same rules as the capture CLI —
   (groups) and @slots dropped, [dynamic] segments have no static intro file. */
let routes = null;
if (APP_DIR) {
    routes = new Set();
    for (const file of walk(APP_DIR, (n) => /^page\.[jt]sx?$/.test(n))) {
        const segs = posix(path.relative(APP_DIR, path.dirname(file)))
            .split("/")
            .filter((s) => s && s !== "." && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
        if (segs.some((s) => s.startsWith("["))) continue;
        routes.add("/" + segs.join("/"));
    }
}

/* data-intro keys in source. Two spellings: the JSX attribute
   (data-intro="x") and an object key ("data-intro": "x") — how a key reaches an
   element the page does not render itself (a table library's container props).
   The quote-then-[:=] requirement keeps data-intro-title out of both. */
const KEY_RE = /["']?data-intro["']?\s*[:=]\s*(?:\{\s*)?["'`]([^"'`]+)["'`]/g;
const sourceKeys = new Set();
for (const file of walk(SRC_DIR, (n) => /\.(?:[cm]?[jt]sx?|vue|svelte|html)$/.test(n))) {
    for (const m of readFileSync(file, "utf8").matchAll(KEY_RE)) {
        if (!m[1].includes("${")) sourceKeys.add(m[1]);
    }
}

const files = walk(INTRO_DIR, (n) => n.endsWith(".json"));
const TARGET_RE = /^\[data-intro=(["'])([^"']+)\1\]$/;
let shippable = 0;
const landmarkSteps = [];

for (const file of files) {
    const rel = posix(path.relative(INTRO_DIR, file));
    let json;
    try {
        json = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
        errors.push(`${rel}: not valid JSON — ${e.message}`);
        continue;
    }

    const res = validateIntro(json);
    if (!res.ok) {
        for (const err of res.errors) errors.push(`${rel}: ${err}`);
        continue;
    }
    const doc = res.doc;

    const expected = routeToIntroPath(doc.route);
    if (expected !== rel) {
        errors.push(`${rel}: route "${doc.route}" belongs at ${expected} — the runtime fetches by path and would never load this file`);
    }
    if (routes && !routes.has(doc.route)) {
        errors.push(`${rel}: route "${doc.route}" has no page file under ${posix(path.relative(ROOT, APP_DIR))} — moved or deleted?`);
    }

    const live = doc.steps.filter((s) => !s.draft);
    if (live.length === 0) warnings.push(`${rel}: every step is draft — this page ships no tour until someone writes the copy`);
    shippable += live.length;

    for (const step of doc.steps) {
        const where = `${rel} › ${step.id}`;
        if (step.draft) warnings.push(`${where}: draft (never shown) — write title/body and remove "draft"`);
        if (step.stale) warnings.push(`${where}: stale — the last capture did not find ${step.target}`);
        if (!step.target) continue;

        const m = step.target.match(TARGET_RE);
        if (m) {
            if (!sourceKeys.has(m[2]) && !step.draft) {
                errors.push(`${where}: targets data-intro="${m[2]}" but nothing in ${values.src}/ carries that key — renamed or removed?`);
            }
        } else {
            landmarkSteps.push(`${where} → ${step.target}${step.optional ? "" : "  (NOT optional)"}`);
            if (!step.optional && !step.draft) {
                errors.push(`${where}: non-data-intro target "${step.target}" must be "optional": true — this gate cannot see it, so a rename must skip the step, not break the tour`);
            }
        }
    }
}

if (!routes) console.log(`  route check skipped — no App Router directory (pass --app-dir <dir>)`);
for (const w of warnings) console.log(`\x1b[33m!\x1b[0m ${w}`);
if (landmarkSteps.length) {
    console.log(`  not statically checkable (non-data-intro targets):`);
    for (const l of landmarkSteps) console.log(`    ${l}`);
}
if (errors.length) {
    for (const e of errors) console.error(`✖ ${e}`);
    console.error(`\nlint:intro — ${errors.length} error(s) across ${files.length} file(s)`);
    process.exit(1);
}
console.log(`✓ lint:intro — ${files.length} file(s), ${shippable} shippable step(s), ${sourceKeys.size} data-intro key(s) in ${values.src}/`);
