#!/usr/bin/env node
/**
 * skeleton-capture.mjs — capture every captured skeleton in the project in one run.
 *
 *   pnpm skeleton:capture                    # every <AutoSkeleton captured> under src/
 *   pnpm skeleton:list                       # what would be captured, and from where; no browser
 *   pnpm skeleton:capture --name table1      # anything else is handed to `auto-skeleton` as is
 *   pnpm skeleton:capture --name new --url <url>   # first capture, before `captured` exists
 *
 * HOW IT GOT HERE. Installed by the starterkit-skeleton-loader skill's
 * `setup-capture.mjs`, which copies this file to the host's `scripts/` and adds
 * to package.json:
 *
 *   "skeleton:capture": "node scripts/skeleton-capture.mjs",
 *   "skeleton:list":    "node scripts/skeleton-capture.mjs --list"
 *
 * It needs `@babel/parser` and `playwright` (or `@playwright/test`) as dev
 * dependencies, and the app running.
 *
 * WHAT IT READS FROM THE PROJECT, so that none of it is typed twice:
 *   - the source tree: `src/` when there is a `src/app`, otherwise `app/`;
 *   - the base path: NEXT_PUBLIC_BASE_PATH from the environment, else from the
 *     first of .env.local / .env.development / .env that sets it (`--base-path`
 *     overrides both);
 *   - `trailingSlash` from next.config.*.
 * WHAT IT ASSUMES: a Next.js App Router tree, and a dev server on
 * http://localhost:3000 (`--origin` or SKELETON_ORIGIN to change). For any other
 * router, rewrite `routeOf`.
 *
 * WHY THIS EXISTS.
 *
 * `auto-skeleton` captures the pages it is given, so the command line becomes a
 * list of URLs somebody keeps by hand. A second captured page needs a second URL
 * added to package.json, and nothing says so when it is forgotten: the page
 * keeps importing a `.bones.json` that is never re-captured, and a stale capture
 * is a slightly wrong placeholder, not an error.
 *
 * So the list is read out of the source instead. An `<AutoSkeleton>` with a
 * `captured` prop is a skeleton that needs capturing; the page file it sits in
 * says which route to open. Add the wrapper to a page and this command covers it.
 *
 * WHAT IT CAPTURES, AND WHAT IT LEAVES ALONE. Only wrappers with `captured`. One
 * that has a `name` and no `captured` is measured in the browser at runtime and
 * has no file to write; `--list` prints those too, marked as such, so that "why
 * was my skeleton not captured" has an answer on screen.
 *
 * WHAT IT CANNOT WORK OUT, stated rather than guessed:
 *   - A wrapper in a shared component, not a `page` file: it has no route of its own.
 *   - A page under a dynamic segment (`[id]`): the route needs a value.
 *   Both are hard failures naming the file, unless a `--url` is passed for them —
 *   then the name is captured from that URL.
 *
 * A NAME THAT WAS NOT WRITTEN IS A FAILURE. `auto-skeleton` exits 0 as long as
 * something was captured, so one page still loading (not logged in, slow API)
 * drops out of a run that looks green. This checks every expected file was
 * actually rewritten and exits 1 naming the ones that were not.
 *
 * NOT A GATE and not in `prebuild`: it needs the dev server and a browser, and
 * its output is a file a person reviews and commits.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { parse } from "@babel/parser";

const ROOT = process.cwd();
const HAS_SRC = existsSync(path.join(ROOT, "src/app"));
const SCAN = HAS_SRC ? "src" : "app";
const SRC = path.join(ROOT, SCAN);
const CLI = path.join(ROOT, "node_modules/@devopsnext/starterkit-skeleton-loader/bin/auto-skeleton.mjs");
const COMPONENT = "AutoSkeleton";
const PAGE_FILE = /^(?:src\/)?app\/(?:(.*)\/)?page\.[jt]sx?$/;
const SOURCE_FILE = /\.[jt]sx?$/;

const readIfThere = (file) => (existsSync(path.join(ROOT, file)) ? readFileSync(path.join(ROOT, file), "utf8") : "");

/* Read from next.config.* rather than typed here: with `trailingSlash` on, a URL
   without the slash is answered with a redirect, and with it off the reverse. A
   text match, not an import — the config may need env this script does not have. */
const TRAILING_SLASH = ["next.config.js", "next.config.mjs", "next.config.ts", "next.config.cjs"].some((file) =>
  /\btrailingSlash\s*:\s*true\b/.test(readIfThere(file)),
);

/** NEXT_PUBLIC_BASE_PATH as Next itself would find it, without needing dotenv. */
function basePathFromEnvFiles() {
  for (const file of [".env.local", ".env.development", ".env"]) {
    const match = readIfThere(file).match(/^\s*NEXT_PUBLIC_BASE_PATH\s*=\s*(.*?)\s*$/m);
    if (match) return match[1].replace(/^(['"])(.*)\1$/, "$2");
  }
  return "";
}

/* Defaults for this project; a flag passed on the command line comes later in
   the argument list and wins. 700 keeps a data table's capture to what is above
   the fold — every breakpoint of it is inlined into the exported HTML. */
const OUT_DEFAULT = HAS_SRC ? "src/skeletons" : "skeletons";
const DEFAULTS = ["--out", OUT_DEFAULT, "--max-height", "700"];

/* ── arguments ──────────────────────────────────────────────────────────────
   `--list` and `--origin` are this script's; everything else is auto-skeleton's
   and is passed through untouched. `--url`, `--name` and `--out` are read on the
   way past because they change what this script expects to be written. */

const argv = process.argv.slice(2);
const forwarded = [];
const extraUrls = [];
const onlyNames = [];
let list = false;
let origin = process.env.SKELETON_ORIGIN || "http://localhost:3000";
let outDir = OUT_DEFAULT;
let basePathFlag;

for (let i = 0; i < argv.length; i++) {
  const [flag, inline] = argv[i].startsWith("--") ? argv[i].split(/=(.*)/s) : [argv[i]];
  const value = () => inline ?? argv[++i];
  if (flag === "--list") list = true;
  else if (flag === "--origin") origin = value();
  else if (flag === "--base-path") basePathFlag = value();
  else if (flag === "--url") extraUrls.push(value());
  else if (flag === "--name") onlyNames.push(value());
  else if (flag === "--out") forwarded.push("--out", (outDir = value()));
  else forwarded.push(argv[i]);
}

const basePath = (basePathFlag ?? process.env.NEXT_PUBLIC_BASE_PATH ?? basePathFromEnvFiles()).replace(/\/+$/, "");
const base = origin.replace(/\/+$/, "") + basePath;

/* ── find the wrappers ────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const file = path.join(dir, entry);
    if (statSync(file).isDirectory()) walk(file, out);
    else if (SOURCE_FILE.test(entry)) out.push(file);
  }
  return out;
}

function visit(node, fn) {
  if (!node || typeof node.type !== "string") return;
  fn(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) for (const child of value) visit(child, fn);
    else if (value && typeof value === "object") visit(value, fn);
  }
}

/** `name="x"` or `name={"x"}`. Anything computed cannot be read from source. */
function literal(attribute) {
  const value = attribute?.value;
  if (value?.type === "StringLiteral") return value.value;
  if (value?.type === "JSXExpressionContainer" && value.expression.type === "StringLiteral") {
    return value.expression.value;
  }
  return null;
}

/** `src/app/(DashboardLayout)/design/table1/page.jsx` -> `/design/table1/`. */
function routeOf(rel) {
  const match = rel.match(PAGE_FILE);
  if (!match) return { reason: "not a page file, so it has no route of its own" };
  // Route groups and parallel-route slots are folders, not URL segments.
  const segments = (match[1] ?? "").split("/").filter((s) => s && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
  if (segments.some((s) => s.startsWith("["))) return { reason: "under a dynamic segment, so the route needs a value" };
  if (!segments.length) return { route: "/" };
  return { route: "/" + segments.join("/") + (TRAILING_SLASH ? "/" : "") };
}

const problems = [];
const wrappers = []; // { name, rel, line, captured, route?, reason? }

if (!existsSync(SRC)) {
  console.error(
    "\n✖ skeleton-capture: no `src/app` or `app` directory here.\n\n" +
    "  Routes are derived from a Next.js App Router tree. Run this from the project root,\n" +
    "  or rewrite `routeOf` for the router this project uses.\n",
  );
  process.exit(1);
}

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");
  if (!source.includes(COMPONENT)) continue;
  const rel = path.relative(ROOT, file).split(path.sep).join("/");

  let ast;
  try {
    ast = parse(source, { sourceType: "module", plugins: /\.tsx?$/.test(file) ? ["jsx", "typescript"] : ["jsx"] });
  } catch (error) {
    problems.push(`${rel}: parse error — ${error.message}`);
    continue;
  }

  visit(ast.program, (node) => {
    if (node.type !== "JSXOpeningElement" || node.name.name !== COMPONENT) return;
    const attribute = (name) => node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === name);
    const captured = Boolean(attribute("captured"));
    const nameAttribute = attribute("name");
    const name = literal(nameAttribute);
    const line = node.loc.start.line;

    if (!captured && !nameAttribute) return; // nothing to capture and nothing to list
    if (captured && !name) {
      problems.push(
        `${rel}:${line}  <${COMPONENT} captured> needs a literal \`name="…"\`.\n` +
        "    The name is how the capture command finds the wrapper and what the file is called;\n" +
        "    a computed one cannot be read from source.",
      );
      return;
    }
    wrappers.push({ name: name ?? "(computed)", rel, line, captured, ...routeOf(rel) });
  });
}

const targets = wrappers.filter((w) => w.captured && (!onlyNames.length || onlyNames.includes(w.name)));

for (const name of new Set(targets.map((w) => w.name))) {
  const same = targets.filter((w) => w.name === name);
  if (same.length > 1) {
    problems.push(
      `"${name}" is the name of ${same.length} captured skeletons — they would overwrite one file:\n` +
      same.map((w) => `    ${w.rel}:${w.line}`).join("\n"),
    );
  }
}
/* A name with no `captured` wrapper yet is the FIRST capture of a new skeleton:
   the file has to exist before the page can import it, so the source cannot say
   where to look. With a --url it is captured from there; without one it is a typo. */
const firstCaptures = onlyNames.filter((name) => !targets.some((w) => w.name === name));
if (!extraUrls.length) {
  for (const name of firstCaptures) {
    problems.push(
      `--name ${name}: no <${COMPONENT} name="${name}" captured> under ${SCAN}/.\n` +
      "    Capturing it for the first time? Say which page shows it: --url <url>",
    );
  }
}
// A route this script could not work out is only a problem when nobody supplied one.
if (!extraUrls.length) {
  for (const w of targets.filter((t) => !t.route)) {
    problems.push(`${w.rel}:${w.line}  "${w.name}" is ${w.reason}.\n    Pass the page that shows it: pnpm skeleton:capture --url <url>`);
  }
}

/* ── --list ───────────────────────────────────────────────────────────────── */

if (list) {
  if (!wrappers.length) console.log(`No named <${COMPONENT}> under ${SCAN}/.`);
  for (const w of wrappers) {
    const where = w.route ? base + w.route : `no route — ${w.reason}`;
    const what = w.captured ? `captured -> ${outDir}/${w.name}.bones.json` : "runtime  -> measured in the browser, no file";
    console.log(`${w.name}\n    ${what}\n    ${where}\n    ${w.rel}:${w.line}`);
  }
}

if (problems.length) {
  console.error("\n✖ skeleton-capture:\n\n" + problems.map((p) => "  " + p).join("\n\n") + "\n");
  process.exit(1);
}
if (list) process.exit(0);

if (!targets.length && !firstCaptures.length) {
  console.log(`✓ skeleton-capture: no <${COMPONENT} captured> under ${SCAN}/ — nothing to capture.`);
  process.exit(0);
}

/* ── capture ──────────────────────────────────────────────────────────────── */

if (!existsSync(CLI)) {
  console.error("\n✖ skeleton-capture: @devopsnext/starterkit-skeleton-loader is not installed. Run `pnpm install`.\n");
  process.exit(1);
}

/* Asked first because the alternative is a Playwright navigation error per
   breakpoint, none of which says "start the dev server". */
const { hostname, port, protocol } = new URL(origin);
const reachable = await new Promise((resolve) => {
  const socket = net.connect({ host: hostname, port: Number(port) || (protocol === "https:" ? 443 : 80) });
  const done = (up) => {
    socket.destroy();
    resolve(up);
  };
  socket.setTimeout(3000);
  socket.once("connect", () => done(true));
  socket.once("timeout", () => done(false));
  socket.once("error", () => done(false));
});
if (!reachable) {
  console.error(
    `\n✖ skeleton-capture: nothing is listening at ${origin}.\n\n` +
    "  A capture is measured from the running app. Start it with `pnpm dev`, or point\n" +
    "  at another server with --origin <url>.\n",
  );
  process.exit(1);
}

const urls = [...new Set([...targets.filter((w) => w.route).map((w) => base + w.route), ...extraUrls])];
const names = [...new Set([...targets.map((w) => w.name), ...firstCaptures])];
const args = [
  ...urls.flatMap((url) => ["--url", url]),
  // Named explicitly: a page can also hold runtime-only wrappers, and capturing
  // those would write files nothing imports.
  ...names.flatMap((name) => ["--name", name]),
  ...DEFAULTS,
  ...forwarded,
];

const started = Date.now();
const result = spawnSync(process.execPath, [CLI, ...args], { stdio: "inherit" });

const missed = names.filter((name) => {
  const file = path.resolve(ROOT, outDir, `${name}.bones.json`);
  return !existsSync(file) || statSync(file).mtimeMs < started;
});
if (missed.length) {
  console.error(
    `\n✖ skeleton-capture: not captured — ${missed.map((n) => `"${n}"`).join(", ")}.\n\n` +
    "  Each wrapper must be showing its real content when the page settles. A page behind\n" +
    "  a login needs a session: save a Playwright storage state after signing in, then\n" +
    "    pnpm skeleton:capture --storage-state <file>\n" +
    "  A slow one needs longer: --wait 4000.\n",
  );
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`✓ skeleton-capture: ${names.length} skeleton(s) from ${urls.length} page(s). Review the diff and commit ${outDir}/.`);
