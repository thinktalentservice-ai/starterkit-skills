/**
 * Tests for scripts/setup-dev-debug.mjs. Zero dependencies:
 *
 *   node --test skills/starterkit-dev-debug/tests/setup-dev-debug.test.mjs
 *
 * Each case scaffolds into a fresh temp directory. The cases that matter most are
 * the refusals: this script writes a standing "log in automatically" rule, so it
 * must not point that rule at a host that could be production.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/setup-dev-debug.mjs");
const SKILL = ".claude/skills/dev-debug/SKILL.md";
const LOGIN = ".claude/skills/dev-debug/login.ps1";
const ENV = ".env.debug.local";
const BASE = {
  "--app-url": "http://localhost:3000/myapp/",
  "--landing-url": "http://localhost:3000/myapp/admin/home",
  "--login-domain": "https://dev.example.com",
};

function project(files = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "dev-debug-"));
  for (const [rel, content] of Object.entries(files)) writeFileSync(path.join(dir, rel), content);
  return dir;
}
function run(dir, extra = [], override = {}) {
  const args = Object.entries({ ...BASE, ...override }).filter(([, v]) => v !== null).flat();
  return spawnSync(process.execPath, [SCRIPT, ...args, ...extra], { cwd: dir, encoding: "utf8" });
}
const read = (dir, rel) => readFileSync(path.join(dir, rel), "utf8");
const count = (text, needle) => text.split(needle).length - 1;
function using(files, fn) {
  const dir = project(files);
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("scaffolds every file with no placeholder left", () => using({}, (dir) => {
  const r = run(dir);
  assert.equal(r.status, 0, r.stderr);
  for (const rel of [SKILL, LOGIN, ENV, "CLAUDE.md", ".gitignore", ".playwright/cli.config.json"]) {
    assert.ok(existsSync(path.join(dir, rel)), rel);
    assert.doesNotMatch(read(dir, rel), /\{\{\w+\}\}/, rel);
  }
  assert.match(read(dir, LOGIN), /\$loginUrl\s+= 'https:\/\/dev\.example\.com\/\*redirect_uri=http:\/\/localhost:3000\/\*'/);
  assert.match(read(dir, LOGIN), /\$doneUrl\s+= 'http:\/\/localhost:3000\/myapp\/admin\/home\*'/);
  assert.ok(read(dir, LOGIN).includes(`-replace '^(["''])(.*)\\1$', '$2'`), "quote-strip backreference survives");
  assert.match(read(dir, ENV), /^DEBUG_USERNAME=$/m);
  assert.match(read(dir, ENV), /^DEBUG_PASSWORD=$/m);
  assert.match(read(dir, ENV), /^DEBUG_DOMAIN=https:\/\/dev\.example\.com$/m);
  assert.equal(count(read(dir, "CLAUDE.md"), "## Playwright headed + dev login (ALWAYS)"), 1);
}));

test("private by default: creds file ignored, no 'marked safe' rule", () => using({}, (dir) => {
  run(dir);
  const ignore = read(dir, ".gitignore");
  assert.match(ignore, /^\.env\*\.local$/m);
  assert.match(ignore, /^\.playwright-cli\/$/m);
  assert.doesNotMatch(ignore, /^!\.env\.debug\.local$/m);
  assert.doesNotMatch(read(dir, "CLAUDE.md"), /marked this safe/);
  assert.match(read(dir, SKILL), /gitignored/);
}));

test("--shared-creds: exception comes after the ignore rule, which stays", () => using(
  { ".gitignore": "node_modules\n.env*.local\n" }, (dir) => {
    assert.equal(run(dir, ["--shared-creds"]).status, 0);
    const lines = read(dir, ".gitignore").split(/\r?\n/);
    assert.ok(lines.includes(".env*.local"));
    assert.ok(lines.lastIndexOf("!.env.debug.local") > lines.lastIndexOf(".env*.local"));
    assert.match(read(dir, "CLAUDE.md"), /marked this safe/);
    assert.match(read(dir, SKILL), /committed on purpose/);
    const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
    git("init", "-q");
    assert.equal(git("check-ignore", "-q", ENV).status, 1, "shared file must be committable");
    assert.equal(git("check-ignore", "-q", ".env.other.local").status, 0, "other local env files stay ignored");
  }));

test("rerun is idempotent and never touches filled-in creds", () => using({}, (dir) => {
  run(dir);
  writeFileSync(path.join(dir, ENV), "DEBUG_USERNAME=u@x.test\nDEBUG_PASSWORD=s3cret-value\n");
  const before = [".gitignore", "CLAUDE.md", SKILL, LOGIN].map((f) => read(dir, f));
  const r = run(dir, ["--force"]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual([".gitignore", "CLAUDE.md", SKILL, LOGIN].map((f) => read(dir, f)), before);
  assert.equal(read(dir, ENV), "DEBUG_USERNAME=u@x.test\nDEBUG_PASSWORD=s3cret-value\n");
  assert.doesNotMatch(r.stdout + r.stderr, /s3cret-value|u@x\.test/);
}));

test("CLAUDE.md: other sections survive, stale section is replaced, CRLF kept", () => using(
  { "CLAUDE.md": "# P\r\n\r\n## Playwright headed + dev login (ALWAYS)\r\n\r\n- old rule\r\n\r\n---\r\n\r\n## Keep me\r\n\r\ntext\r\n" }, (dir) => {
    const original = read(dir, "CLAUDE.md");
    assert.equal(run(dir).status, 1, "hand-written section needs --force");
    assert.equal(read(dir, "CLAUDE.md"), original);
    assert.ok(!existsSync(path.join(dir, LOGIN)), "a blocked run writes nothing");
    assert.equal(run(dir, ["--force"]).status, 0);
    const md = read(dir, "CLAUDE.md");
    assert.doesNotMatch(md, /old rule/);
    assert.match(md, /## Keep me\r\n\r\ntext/);
    assert.match(md, /\r\n---\r\n\r\n## Keep me/);
    assert.equal(count(md, "## Playwright headed + dev login (ALWAYS)"), 1);
    assert.doesNotMatch(md, /(?<!\r)\n/);
  }));

test("a different existing dev-debug file blocks without --force", () => using({}, (dir) => {
  run(dir);
  writeFileSync(path.join(dir, LOGIN), "# hand edited\n");
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.equal(read(dir, LOGIN), "# hand edited\n");
  assert.match(r.stdout + r.stderr, /--force/);
}));

test("--dry-run writes nothing", () => using({}, (dir) => {
  assert.equal(run(dir, ["--dry-run"]).status, 0);
  for (const rel of [SKILL, ENV, "CLAUDE.md", ".gitignore"]) assert.ok(!existsSync(path.join(dir, rel)), rel);
}));

for (const [name, override] of [
  ["production-looking host", { "--login-domain": "https://app.example.com" }],
  ["'dev' only in the top-level domain", { "--login-domain": "https://thing.dev" }],
  ["'dev' only inside a word", { "--login-domain": "https://devices.example.com" }],
  ["'test' is the registered domain name", { "--login-domain": "https://test.com" }],
  ["'test' inside the registered domain name", { "--login-domain": "https://app.my-test.com" }],
  ["plain http remote host", { "--login-domain": "http://dev.example.com" }],
  ["login domain with a path", { "--login-domain": "https://dev.example.com/x" }],
  ["remote app URL", { "--app-url": "https://dev.example.com/app/" }],
  ["landing outside the app", { "--landing-url": "http://localhost:3000/other" }],
  ["landing equal to app root", { "--landing-url": "http://localhost:3000/myapp/" }],
  ["login pattern on another host", { "--login-url": "https://evil.example.net/*" }],
  ["quote injection in a label", { "--user-label": "E'; calc; '" }],
  ["missing required option", { "--login-domain": null }],
]) {
  test(`refuses: ${name}`, () => using({}, (dir) => {
    const r = run(dir, [], override);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stderr, /setup-dev-debug:/);
    assert.ok(!existsSync(path.join(dir, LOGIN)));
    assert.ok(!existsSync(path.join(dir, "CLAUDE.md")));
  }));
}

test("refuses unknown flags, so a password cannot be passed on the command line", () => using({}, (dir) => {
  const r = run(dir, ["--password", "hunter2-value"]);
  assert.equal(r.status, 1);
  assert.doesNotMatch(r.stdout + r.stderr, /hunter2-value/);
}));
