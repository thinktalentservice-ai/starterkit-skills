#!/usr/bin/env node
/**
 * setup-intro.mjs — give a project the intro gate and the capture commands.
 *
 * Run from the HOST PROJECT'S ROOT, pointing at this file wherever the skill is
 * installed:
 *
 *   node <skill-dir>/scripts/setup-intro.mjs --dry-run
 *   node <skill-dir>/scripts/setup-intro.mjs --exclude /login --exclude /auth
 *   node <skill-dir>/scripts/setup-intro.mjs --storage-state .auth/session.json --no-landmarks
 *   node <skill-dir>/scripts/setup-intro.mjs --force       # replace what is already there
 *
 * WHAT IT DOES, all of it idempotent:
 *   1. copies check-intro.mjs (its sibling) to <host>/scripts/;
 *   2. adds to package.json
 *        "lint:intro":    "node scripts/check-intro.mjs"
 *      and, for a Next.js App Router project (src/app or app exists),
 *        "intro:list":    "starterkit-intro list --next-app <dir> [--exclude …]"
 *        "intro:capture": "starterkit-intro capture --next-app <dir> [--exclude …] [--no-landmarks] [--storage-state …]"
 *      For any other router it adds only lint:intro (with --app-dir none) and
 *      prints the --url form of the capture command to write by hand;
 *   3. reports the dependencies the commands need and the project lacks.
 *
 * WHAT IT WILL NOT DO WITHOUT --force: overwrite a script entry that says
 * something else, or a scripts/check-intro.mjs that differs from this one.
 *
 * WHAT IT NEVER DOES: install anything (pins and release-age policy are the
 * host's rule), or wire lint:intro into a build/prebuild/CI chain — where a gate
 * runs is a decision about what may block a deploy, so it is printed instead.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    exclude: { type: "string", multiple: true, default: [] },
    "storage-state": { type: "string" },
    "no-landmarks": { type: "boolean", default: false },
  },
});
const DRY = values["dry-run"];
const FORCE = values.force;

const ROOT = process.cwd();
const SOURCE = path.join(path.dirname(fileURLToPath(import.meta.url)), "check-intro.mjs");
const TARGET = path.join(ROOT, "scripts", "check-intro.mjs");
const MANIFEST = path.join(ROOT, "package.json");
const PACKAGE = "@devopsnext/starterkit-intro";

const done = [];
const blocked = [];
const WOULD = { copied: "would copy", added: "would add", replaced: "would replace" };
const say = (verb, what) => done.push(`${DRY ? WOULD[verb] : verb}  ${what}`);

if (!existsSync(MANIFEST)) {
  console.error("\n✖ setup-intro: no package.json here. Run this from the host project's root.\n");
  process.exit(1);
}

const manifestText = readFileSync(MANIFEST, "utf8");
const manifest = JSON.parse(manifestText);
const has = (name) => Boolean(manifest.dependencies?.[name] || manifest.devDependencies?.[name]);

if (!has(PACKAGE)) {
  console.error(
    `\n✖ setup-intro: ${PACKAGE} is not a dependency of this project.\n\n` +
    "  Install it first — look up the latest version, then pin that exact number.\n",
  );
  process.exit(1);
}

const appDir = ["src/app", "app"].find((d) => existsSync(path.join(ROOT, d))) ?? null;
const srcDir = existsSync(path.join(ROOT, "src")) ? "src" : appDir ?? ".";

/* ── 1. the gate script ───────────────────────────────────────────────────── */

const normalise = (text) => text.replace(/\r\n/g, "\n");
if (!existsSync(TARGET)) {
  if (!DRY) {
    mkdirSync(path.dirname(TARGET), { recursive: true });
    copyFileSync(SOURCE, TARGET);
  }
  say("copied", "scripts/check-intro.mjs");
} else if (normalise(readFileSync(TARGET, "utf8")) === normalise(readFileSync(SOURCE, "utf8"))) {
  done.push("kept    scripts/check-intro.mjs  (already this version)");
} else if (FORCE) {
  if (!DRY) copyFileSync(SOURCE, TARGET);
  say("replaced", "scripts/check-intro.mjs");
} else {
  blocked.push(
    "scripts/check-intro.mjs exists and differs from the skill's copy.\n" +
    "    It may be older, or edited for this project. Diff the two; --force replaces it.",
  );
}

/* ── 2. package.json ──────────────────────────────────────────────────────── */

const gateArgs = [
  srcDir !== "src" ? `--src ${srcDir}` : "",
  appDir ? "" : "--app-dir none",
].filter(Boolean).join(" ");

const SCRIPTS = { "lint:intro": `node scripts/check-intro.mjs${gateArgs ? " " + gateArgs : ""}` };
if (appDir) {
  const ex = values.exclude.map((e) => ` --exclude ${e}`).join("");
  SCRIPTS["intro:list"] = `starterkit-intro list --next-app ${appDir}${ex}`;
  SCRIPTS["intro:capture"] =
    `starterkit-intro capture --next-app ${appDir}${ex}` +
    (values["no-landmarks"] ? " --no-landmarks" : "") +
    (values["storage-state"] ? ` --storage-state ${values["storage-state"]}` : "");
}

manifest.scripts ??= {};
let changed = false;
for (const [name, command] of Object.entries(SCRIPTS)) {
  const current = manifest.scripts[name];
  if (current === command) {
    done.push(`kept    package.json  "${name}"  (already set)`);
  } else if (current === undefined || FORCE) {
    manifest.scripts[name] = command;
    changed = true;
    say(current === undefined ? "added" : "replaced", `package.json  "${name}": "${command}"`);
    if (current !== undefined) done.push(`          was: "${current}"`);
  } else {
    blocked.push(`package.json already has "${name}":\n      "${current}"\n    this would set:\n      "${command}"\n    Re-run with --force once you have read both.`);
  }
}

if (changed && !DRY) {
  // Keep the file's own indentation and line endings.
  const indent = manifestText.match(/^([ \t]+)"/m)?.[1] ?? "  ";
  const eol = manifestText.includes("\r\n") ? "\r\n" : "\n";
  const tail = manifestText.endsWith("\n") ? eol : "";
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, indent).replace(/\n/g, eol) + tail);
}

/* ── 3. what the commands need ────────────────────────────────────────────── */

const missing = [];
if (!has("playwright") && !has("@playwright/test")) missing.push("playwright");

const client = existsSync(path.join(ROOT, "pnpm-lock.yaml"))
  ? { add: "pnpm add -D", run: "pnpm", exec: "pnpm exec" }
  : existsSync(path.join(ROOT, "yarn.lock"))
    ? { add: "yarn add -D", run: "yarn", exec: "yarn" }
    : { add: "npm install -D", run: "npm run", exec: "npx" };

/* ── report ───────────────────────────────────────────────────────────────── */

console.log("\nsetup-intro" + (DRY ? "  (dry run — nothing written)" : "") + "\n");
for (const line of done) console.log("  " + line);

if (missing.length) {
  console.log(
    `\n  The capture command needs, and this project does not have: ${missing.join(", ")}\n` +
    `    ${client.add} ${missing.join(" ")}   (pin it exactly if the project pins)\n` +
    `    ${client.exec} playwright install chromium-headless-shell`,
  );
}

if (!appDir) {
  console.log(
    "\n  No Next.js App Router directory, so no intro:capture was added. Write one with a\n" +
    "  --url per page (the route is the URL's path minus --base-path):\n" +
    '    "intro:capture": "starterkit-intro capture --url http://localhost:5173/ --url http://localhost:5173/settings --base-path \\"\\""',
  );
}

if (blocked.length) {
  console.error("\n✖ Not done — each of these is a decision, not a default:\n\n" + blocked.map((b) => "  " + b).join("\n\n") + "\n");
  process.exit(1);
}

console.log(
  "\n  Next:\n" +
  (appDir ? `    ${client.run} intro:list       # every route, its URL and its file — check first\n` : "") +
  (appDir ? `    ${client.run} intro:capture    # with the app running; writes drafts, keeps written copy\n` : "") +
  `    ${client.run} lint:intro       # then add it to the project's gate/CI chain yourself\n`,
);
