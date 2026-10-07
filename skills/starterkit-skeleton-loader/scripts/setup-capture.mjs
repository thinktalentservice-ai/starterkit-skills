#!/usr/bin/env node
/**
 * setup-capture.mjs — give a project one command that captures all its skeletons.
 *
 * Run from the HOST PROJECT'S ROOT, pointing at this file wherever the skill is
 * installed:
 *
 *   node <skill-dir>/scripts/setup-capture.mjs             # do it
 *   node <skill-dir>/scripts/setup-capture.mjs --dry-run   # say what it would do
 *   node <skill-dir>/scripts/setup-capture.mjs --force     # replace what is already there
 *
 * WHAT IT DOES, all of it idempotent:
 *   1. copies skeleton-capture.mjs (its sibling) to <host>/scripts/;
 *   2. adds to package.json
 *        "skeleton:capture": "node scripts/skeleton-capture.mjs"
 *        "skeleton:list":    "node scripts/skeleton-capture.mjs --list"
 *   3. reports the dev dependencies the script needs and the host lacks, with the
 *      command to add them.
 *
 * WHAT IT WILL NOT DO WITHOUT --force: overwrite a `skeleton:capture` script that
 * says something else, or a scripts/skeleton-capture.mjs that differs from this
 * one. Either is somebody's decision — usually a hand-kept list of `--url`s that
 * this replaces — and it is printed so the diff is read before it is made.
 *
 * It installs nothing. Adding a dependency is the host's call: it may pin exact
 * versions, or refuse releases younger than a day.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const FORCE = argv.includes("--force");

const ROOT = process.cwd();
const SOURCE = path.join(path.dirname(fileURLToPath(import.meta.url)), "skeleton-capture.mjs");
const TARGET = path.join(ROOT, "scripts", "skeleton-capture.mjs");
const MANIFEST = path.join(ROOT, "package.json");
const PACKAGE = "@devopsnext/starterkit-skeleton-loader";

const SCRIPTS = {
  "skeleton:capture": "node scripts/skeleton-capture.mjs",
  "skeleton:list": "node scripts/skeleton-capture.mjs --list",
};

const done = [];
const blocked = [];
const WOULD = { copied: "would copy", added: "would add", replaced: "would replace" };
const say = (verb, what) => done.push(`${DRY ? WOULD[verb] : verb}  ${what}`);

if (!existsSync(MANIFEST)) {
  console.error("\n✖ setup-capture: no package.json here. Run this from the host project's root.\n");
  process.exit(1);
}

const manifestText = readFileSync(MANIFEST, "utf8");
const manifest = JSON.parse(manifestText);
const has = (name) => Boolean(manifest.dependencies?.[name] || manifest.devDependencies?.[name]);

if (!has(PACKAGE)) {
  console.error(
    `\n✖ setup-capture: ${PACKAGE} is not a dependency of this project.\n\n` +
    "  Install it first — look up the latest version, then pin that exact number.\n",
  );
  process.exit(1);
}
if (!existsSync(path.join(ROOT, "src/app")) && !existsSync(path.join(ROOT, "app"))) {
  console.error(
    "\n✖ setup-capture: no `src/app` or `app` directory.\n\n" +
    "  skeleton-capture.mjs derives each URL from a Next.js App Router page file. For another\n" +
    "  router, copy the script by hand and rewrite `routeOf`.\n",
  );
  process.exit(1);
}

/* ── 1. the script ────────────────────────────────────────────────────────── */

const normalise = (text) => text.replace(/\r\n/g, "\n");
const incoming = readFileSync(SOURCE, "utf8");

if (!existsSync(TARGET)) {
  if (!DRY) {
    mkdirSync(path.dirname(TARGET), { recursive: true });
    copyFileSync(SOURCE, TARGET);
  }
  say("copied", "scripts/skeleton-capture.mjs");
} else if (normalise(readFileSync(TARGET, "utf8")) === normalise(incoming)) {
  done.push("kept    scripts/skeleton-capture.mjs  (already this version)");
} else if (FORCE) {
  if (!DRY) copyFileSync(SOURCE, TARGET);
  say("replaced", "scripts/skeleton-capture.mjs");
} else {
  blocked.push(
    "scripts/skeleton-capture.mjs exists and differs from the skill's copy.\n" +
    "    It may be an older version, or one the project has edited (a different router, other\n" +
    "    defaults). Diff the two before choosing; --force replaces it.",
  );
}

/* ── 2. package.json ──────────────────────────────────────────────────────── */

manifest.scripts ??= {};
let changed = false;
for (const [name, command] of Object.entries(SCRIPTS)) {
  const current = manifest.scripts[name];
  if (current === command) {
    done.push(`kept    package.json  "${name}"  (already set)`);
  } else if (current?.includes("scripts/skeleton-capture.mjs") && !FORCE) {
    // Already the project-wide script, wrapped the project's own way (an env
    // loader, say). That is a choice, not something to "fix".
    done.push(`kept    package.json  "${name}"  (already runs the script: "${current}")`);
  } else if (current === undefined || FORCE) {
    manifest.scripts[name] = command;
    changed = true;
    say(current === undefined ? "added" : "replaced", `package.json  "${name}": "${command}"`);
    if (current !== undefined) done.push(`          was: "${current}"`);
  } else {
    blocked.push(
      `package.json already has "${name}":\n      "${current}"\n` +
      `    The project-wide command is:\n      "${command}"\n` +
      "    A hand-kept `auto-skeleton --url …` line is what this replaces. Note its URLs and\n" +
      "    flags, re-run with --force, then check `skeleton:list` finds every one of those pages.",
    );
  }
}

if (changed && !DRY) {
  // Keep the file's own indentation and line endings: a reformatted manifest
  // buries a two-line change in a diff of the whole file.
  const indent = manifestText.match(/^([ \t]+)"/m)?.[1] ?? "  ";
  const eol = manifestText.includes("\r\n") ? "\r\n" : "\n";
  const tail = manifestText.endsWith("\n") ? eol : "";
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, indent).replace(/\n/g, eol) + tail);
}

/* ── 3. what the script needs ─────────────────────────────────────────────── */

const missing = [];
if (!has("@babel/parser")) missing.push("@babel/parser");
if (!has("playwright") && !has("@playwright/test")) missing.push("playwright");

const client = existsSync(path.join(ROOT, "pnpm-lock.yaml"))
  ? { add: "pnpm add -D", run: "pnpm", exec: "pnpm exec" }
  : existsSync(path.join(ROOT, "yarn.lock"))
    ? { add: "yarn add -D", run: "yarn", exec: "yarn" }
    : { add: "npm install -D", run: "npm run", exec: "npx" };

/* ── report ───────────────────────────────────────────────────────────────── */

console.log("\nsetup-capture" + (DRY ? "  (dry run — nothing written)" : "") + "\n");
for (const line of done) console.log("  " + line);

if (missing.length) {
  console.log(
    `\n  Needs, and this project does not have: ${missing.join(", ")}\n` +
    `    ${client.add} ${missing.join(" ")}` +
    (missing.includes("playwright") ? `\n    ${client.exec} playwright install chromium` : ""),
  );
}

if (blocked.length) {
  console.error("\n✖ Not done — each of these is a decision, not a default:\n\n" + blocked.map((b) => "  " + b).join("\n\n") + "\n");
  process.exit(1);
}

console.log(
  "\n  Next:\n" +
  `    ${client.run} skeleton:list       # what it found, and the URL of each — check these first\n` +
  `    ${client.run} skeleton:capture    # with the app running\n`,
);
