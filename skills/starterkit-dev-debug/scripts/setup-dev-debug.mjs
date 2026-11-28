#!/usr/bin/env node
/**
 * setup-dev-debug.mjs — give a project a `dev-debug` skill: headed playwright-cli
 * with automatic login on a development host.
 *
 * Run from the HOST PROJECT'S ROOT:
 *
 *   node <skill-dir>/scripts/setup-dev-debug.mjs \
 *     --app-url http://localhost:3000/app/ \
 *     --landing-url http://localhost:3000/app/dashboard \
 *     --login-domain https://dev.example.com
 *
 * Optional:
 *   --shared-creds        .env.debug.local is meant to be committed (default: ignored)
 *   --login-url <glob>    login page pattern, on --login-domain
 *                         (default: <domain>/*redirect_uri=<app origin>/*)
 *   --done-url <glob>     "logged in" pattern, inside --app-url (default: <landing>*)
 *   --user-label, --password-label, --submit-label   accessible names on the login form
 *   --dry-run             say what would change
 *   --force               replace dev-debug files or a CLAUDE.md section that differ
 *
 * There is deliberately no option for the username or password. The script writes
 * .env.debug.local with empty values, a person fills them in, and an existing file
 * is never opened for writing or printed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const VALUE_FLAGS = [
  "app-url", "landing-url", "login-domain", "login-url", "done-url",
  "user-label", "password-label", "submit-label",
];
const BOOL_FLAGS = ["shared-creds", "dry-run", "force"];
const HEADING = "## Playwright headed + dev login (ALWAYS)";
const ENV_FILE = ".env.debug.local";
const IGNORE_LOCAL = ".env*.local";
const KEEP_SHARED = `!${ENV_FILE}`;
const TEST_WORDS = new Set([
  "dev", "develop", "development", "test", "testing", "stage", "staging", "qa", "sandbox", "preview",
]);

function fail(message) {
  console.error(`\n✖ setup-dev-debug: ${message}\n`);
  process.exit(1);
}

/* ── options ──────────────────────────────────────────────────────────────── */

const options = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const name = argv[i].startsWith("--") ? argv[i].slice(2) : null;
  if (BOOL_FLAGS.includes(name)) options[name] = true;
  else if (VALUE_FLAGS.includes(name)) {
    const value = argv[++i];
    if (!value || value.startsWith("--")) fail(`--${name} needs a value.`);
    // These end up inside PowerShell and JavaScript string literals.
    if (/['"`$\r\n{}‘-‟]/.test(value)) fail(`--${name} contains a quote, $, brace or newline.`);
    options[name] = value;
  } else {
    // Never echo the argument: someone may have tried to pass a password.
    fail("unknown argument. Credentials go in .env.debug.local, never on the command line.");
  }
}
for (const name of ["app-url", "landing-url", "login-domain"]) {
  if (!options[name]) fail(`--${name} is required.`);
}

const parse = (name) => {
  let url;
  try { url = new URL(options[name]); } catch { fail(`--${name} is not a URL.`); }
  if (url.username || url.password) fail(`--${name} must not contain credentials.`);
  return url;
};
const isLoopback = (host) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(host) || host.endsWith(".localhost");

const app = parse("app-url");
if (!isLoopback(app.hostname)) fail("--app-url must be on localhost, 127.0.0.1, [::1] or *.localhost.");
const appUrl = app.href.endsWith("/") ? app.href : `${app.href}/`;

const landing = parse("landing-url").href;
if (!landing.startsWith(appUrl) || landing.replace(/\/$/, "") === appUrl.replace(/\/$/, "")) {
  fail("--landing-url must be a page below --app-url, so a local login page is not mistaken for success.");
}

const domain = parse("login-domain");
if (domain.pathname !== "/" || domain.search || domain.hash) fail("--login-domain is an origin only, with no path.");
const local = isLoopback(domain.hostname) || domain.hostname.endsWith(".test");
// Only subdomain labels count: thing.dev, test.com and app.my-test.com can all be production sites.
const markedTest = domain.hostname.split(".").slice(0, -2)
  .some((label) => label.split("-").some((word) => TEST_WORDS.has(word)));
if (!local && !markedTest) {
  fail("--login-domain does not look like a development host (needs a label such as dev, test, staging or qa). " +
    "Automatic login must never be set up against a production site.");
}
if (!local && domain.protocol !== "https:") fail("--login-domain must use https.");

const loginUrl = options["login-url"] ?? `${domain.origin}/*redirect_uri=${app.origin}/*`;
if (!loginUrl.startsWith(`${domain.origin}/`)) fail("--login-url must start with --login-domain followed by /.");
const doneUrl = options["done-url"] ?? `${landing.replace(/\/$/, "")}*`;
if (!doneUrl.startsWith(appUrl) || doneUrl === `${appUrl}*`) {
  fail("--done-url must be narrower than --app-url plus *.");
}

const shared = Boolean(options["shared-creds"]);
const values = {
  APP_URL: appUrl,
  LANDING_URL: landing,
  LOGIN_DOMAIN: domain.origin,
  LOGIN_HOST: domain.host,
  LOGIN_URL: loginUrl,
  DONE_URL: doneUrl,
  USER_LABEL: options["user-label"] ?? "E-mail",
  PASSWORD_LABEL: options["password-label"] ?? "Password",
  SUBMIT_LABEL: options["submit-label"] ?? "Log in",
  CREDS_STORAGE: shared
    ? "committed on purpose so all developers share one debug login"
    : "gitignored; each developer fills in their own copy",
  CREDS_SHORT: shared ? "committed, shared by developers" : "gitignored",
  SHARED_RULE: shared
    ? `- \`${ENV_FILE}\` is committed on purpose so all developers share the debug login. The project owner has marked ` +
      `this safe: it is for development and debugging on \`${domain.origin}\` only. Don't flag it as a leaked secret, ` +
      "untrack it or add it to `.gitignore`. This covers this file only, and its creds must never be used on any other host.\n"
    : "",
};

/* ── plan every change before writing any ─────────────────────────────────── */

const ROOT = process.cwd();
const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), "../assets");
const lf = (text) => text.replace(/\r\n/g, "\n");
const render = (name) =>
  lf(readFileSync(path.join(ASSETS, name), "utf8")).replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) fail(`template ${name} uses unknown key ${key}.`);
    return values[key];
  });
const current = (rel) => {
  const full = path.join(ROOT, rel);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
};

const writes = [];
const notes = [];
const blocked = [];
const plan = (rel, content, existing) => {
  const text = existing?.includes("\r\n") ? lf(content).replace(/\n/g, "\r\n") : content;
  if (existing !== null && lf(existing) === lf(text)) return notes.push(`unchanged  ${rel}`);
  writes.push({ rel, text, verb: existing === null ? "create" : "update" });
};

// 1. the generated skill: files this script owns
for (const [asset, rel] of [
  ["SKILL.md.tmpl", ".claude/skills/dev-debug/SKILL.md"],
  ["login.ps1.tmpl", ".claude/skills/dev-debug/login.ps1"],
]) {
  const wanted = render(asset);
  const existing = current(rel);
  if (existing !== null && lf(existing) !== wanted && !options.force) blocked.push(rel);
  else plan(rel, wanted, existing);
}

// 2. the CLAUDE.md section: replace only that section, up to the next "---" or "## "
{
  const section = render("claude-md-section.md.tmpl");
  const existing = current("CLAUDE.md");
  const lines = lf(existing ?? "").split("\n");
  const start = lines.findIndex((line) => line.trimEnd() === HEADING);
  if (start === -1) {
    const head = lf(existing ?? "").trimEnd();
    plan("CLAUDE.md", head ? `${head}\n\n---\n\n${section}` : section, existing);
  } else {
    let end = start + 1;
    while (end < lines.length && !/^(## |---\s*$)/.test(lines[end])) end++;
    const old = lines.slice(start, end).join("\n").trimEnd();
    if (old === section.trimEnd()) notes.push("unchanged  CLAUDE.md");
    else if (!options.force) blocked.push(`CLAUDE.md section "${HEADING}"`);
    else {
      const tail = lines.slice(end);
      const next = [...lines.slice(0, start), ...section.trimEnd().split("\n"), ...(tail.length ? ["", ...tail] : [""])];
      plan("CLAUDE.md", next.join("\n"), existing);
    }
  }
}

// 3. .gitignore
{
  const existing = current(".gitignore");
  let lines = lf(existing ?? "").replace(/\n+$/, "").split("\n").filter((line, i, all) => all.length > 1 || line);
  const has = (...rules) => lines.some((line) => rules.includes(line.trim()));
  const add = [];
  if (!has(".playwright-cli/", ".playwright-cli", "/.playwright-cli/")) {
    add.push("# playwright-cli output and saved login sessions", ".playwright-cli/");
  }
  if (!has(IGNORE_LOCAL)) add.push("# local env files", IGNORE_LOCAL);
  lines.push(...add);
  const trimmed = lines.map((line) => line.trim());
  if (shared) {
    // The exception only works when it comes after the rule it overrides.
    if (trimmed.lastIndexOf(KEEP_SHARED) <= trimmed.lastIndexOf(IGNORE_LOCAL)) {
      lines = lines.filter((line) => line.trim() !== KEEP_SHARED);
      lines.push("# shared debug login, committed on purpose", KEEP_SHARED);
    }
  } else if (trimmed.includes(KEEP_SHARED)) {
    if (!options.force) blocked.push(`.gitignore line "${KEEP_SHARED}" (pass --shared-creds to keep sharing it)`);
    lines = lines.filter((line) => line.trim() !== KEEP_SHARED);
  }
  plan(".gitignore", `${lines.join("\n")}\n`, existing);
}

// 4. files that are created once and then belong to the project
for (const [rel, content] of [
  [".playwright/cli.config.json",
    `${JSON.stringify({ browser: { launchOptions: { headless: false } } }, null, 2)}\n`],
  [ENV_FILE,
    "# Development/debug login only. Never put a production or personal password here.\n" +
    `DEBUG_BASE_URL=${appUrl}\nDEBUG_USERNAME=\nDEBUG_PASSWORD=\nDEBUG_DOMAIN=${domain.origin}\n`],
]) {
  if (existsSync(path.join(ROOT, rel))) notes.push(`kept       ${rel} (already there, not touched)`);
  else plan(rel, content, null);
}

/* ── apply ────────────────────────────────────────────────────────────────── */

if (blocked.length) {
  fail(`nothing written. These differ from what would be generated:\n  - ${blocked.join("\n  - ")}\n` +
    "Read the difference, then rerun with --force to replace them.");
}
for (const { rel, text, verb } of writes) {
  if (!options["dry-run"]) {
    mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
    writeFileSync(path.join(ROOT, rel), text);
  }
  notes.push(`${options["dry-run"] ? `would ${verb}` : `${verb}d`}  ${rel}`);
}
console.log(notes.join("\n"));

if (!options["dry-run"]) {
  const git = (...args) => spawnSync("git", args, { cwd: ROOT }).status;
  if (git("rev-parse", "--git-dir") === 0) {
    const ignored = git("check-ignore", "-q", "--no-index", ENV_FILE) === 0;
    const tracked = git("ls-files", "--error-unmatch", ENV_FILE) === 0;
    if (!shared && tracked) console.warn(`\n! ${ENV_FILE} is already tracked by git. Ignore rules do not untrack it.`);
    if (!shared && !ignored) console.warn(`\n! ${ENV_FILE} is NOT ignored. Check .gitignore before committing.`);
    if (shared) {
      // check-ignore -v also reports "!" matches, so ask git what `add` would do.
      const addable = tracked || git("add", "--dry-run", ENV_FILE) === 0;
      if (!addable) console.warn(`\n! Another ignore rule still hides ${ENV_FILE}. Check .gitignore.`);
    }
  }
  console.log(`\nNext: fill DEBUG_USERNAME and DEBUG_PASSWORD in ${ENV_FILE} (debug-only account).`);
}
