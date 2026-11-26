/**
 * Regression tests for scripts/check-css-imports.mjs. Zero dependencies:
 *
 *   node --test skills/starterkit-css-imports/tests/check-css-imports.test.mjs
 *
 * (Pass the file, not the directory: Node 24 resolves a bare directory as a
 * module and fails with MODULE_NOT_FOUND.)
 *
 * Every fixture is built in a fresh temp directory from the strings below, so
 * a case reads top to bottom: the files, the command, what must come out.
 * Each case pins a behaviour that was either a design decision or a bug once —
 * the CRLF case is the second kind (--fix inserted one line early on Windows).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHECKER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/check-css-imports.mjs");

/** Write `files` ({relPath: content}) into a temp dir, run the checker there. */
function run(files, args = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "css-imports-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  const r = spawnSync(process.execPath, [CHECKER, ...args], { cwd: dir, encoding: "utf8" });
  const read = (rel) => readFileSync(path.join(dir, rel), "utf8");
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  return { code: r.status, out: r.stdout + r.stderr, read, cleanup };
}

const sheetOrder = (layout) => [...layout.matchAll(/import\s+["']([^"']+\.(?:s?css))["']/g)].map((m) => m[1]);

test("hoisted .css import in Sass: error, then --fix places it before the .scss (CRLF entry)", (t) => {
  const crlf = (s) => s.replace(/\n/g, "\r\n");
  const files = {
    "src/app/layout.jsx": crlf(
      'import "@devopsnext/starterkit-theme/presets/think.css";\n' +
      'import "@/styles/colors_and_type.css";\n' +
      'import "@fortawesome/fontawesome-free/css/all.min.css";\n' +
      'import "@/styles/style.scss";\n' +
      'import "@devopsnext/starterkit-theme/bootstrap-bridge.css";\n' +
      'import "@/styles/globals.css";\n' +
      "export default function L({ children }) { return children; }\n",
    ),
    "src/styles/colors_and_type.css": ":root{--x:1}\n",
    "src/styles/globals.css": '@import "tailwindcss/utilities.css" layer(utilities);\n.g{}\n',
    "src/styles/style.scss":
      "@import 'bootstrap/scss/bootstrap';\n@import './layout/extra';\n" +
      "@import 'simplebar-react/dist/simplebar.min.css';\n" +
      '@import "./icons/mdi.min.css";\n',
    "src/styles/layout/_extra.scss": ".e{color:red}\n",
    "src/styles/icons/mdi.min.css": ".mdi{}\n",
  };

  const check = run(files);
  t.after(check.cleanup);
  assert.equal(check.code, 1);
  assert.match(check.out, /style\.scss:3 .*simplebar\.min\.css.*HOISTED/);
  assert.match(check.out, /style\.scss:4 .*mdi\.min\.css.*HOISTED/);

  const fix = run(files, ["--fix"]);
  t.after(fix.cleanup);
  assert.equal(fix.code, 0, fix.out);
  const layout = fix.read("src/app/layout.jsx");
  assert.deepEqual(sheetOrder(layout), [
    "@devopsnext/starterkit-theme/presets/think.css",
    "@/styles/colors_and_type.css",
    "@fortawesome/fontawesome-free/css/all.min.css",
    "simplebar-react/dist/simplebar.min.css",       // where Sass already loaded it:
    "@/styles/icons/mdi.min.css",                    // above the .scss, in source order
    "@/styles/style.scss",
    "@devopsnext/starterkit-theme/bootstrap-bridge.css",
    "@/styles/globals.css",
  ]);
  assert.ok(!/(^|[^\r])\n/.test(layout), "inserted lines must keep the file's CRLF endings");
  const scss = fix.read("src/styles/style.scss");
  assert.doesNotMatch(scss, /\.css/);
  assert.match(scss, /@import '\.\/layout\/extra';/);
});

test("multi-argument import keeps the Sass part; a partial's hoisted import is attributed to its entry", (t) => {
  const r = run({
    "app/layout.tsx": 'import "../styles/main.scss"\nimport "../styles/globals.css"\n',
    "styles/main.scss": "@import 'partial', 'vend/v.css';\n.m{}\n",
    "styles/_partial.scss": '.p{}\n@import "../node_modules/vend/deep.css";\n',
    "styles/globals.css": ".g{}\n",
    "node_modules/vend/v.css": ".v{}",
    "node_modules/vend/deep.css": ".d{}",
  }, ["--fix", "--src", "."]);
  t.after(r.cleanup);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(sheetOrder(r.read("app/layout.tsx")), [
    "../node_modules/vend/deep.css", // reached first: 'partial' precedes 'vend/v.css'
    "vend/v.css",
    "../styles/main.scss",
    "../styles/globals.css",
  ]);
  assert.match(r.read("app/layout.tsx"), /^import "vend\/v\.css"$/m, "no semicolon when the entry uses none");
  assert.match(r.read("styles/main.scss"), /^@import 'partial';$/m);
  assert.doesNotMatch(r.read("styles/_partial.scss"), /@import/);
});

test("commented-out imports and // inside url() are not findings", (t) => {
  const r = run({
    "app/layout.jsx": '// import "./decoy.css";\n/* import "./decoy2.css"; */\nimport "../styles/main.scss";\n',
    "styles/main.scss":
      "// @import 'commented.css';\n/* @import \"block.css\"; */\n" +
      ".a { background: url(http://x.test//y.png); }\n",
  }, ["--src", "."]);
  t.after(r.cleanup);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0 error\(s\), 0 warning\(s\)/);
});

test("remote and media-queried imports are errors that --fix leaves for a human", (t) => {
  const r = run({
    "app/layout.jsx": 'import "../styles/main.scss";\n',
    "styles/main.scss": '@import url("https://fonts.example/css");\n@import "print.css" print;\n',
  }, ["--fix", "--src", "."]);
  t.after(r.cleanup);
  assert.equal(r.code, 1);
  assert.match(r.out, /manual .*remote URL; self-host/);
  assert.match(r.out, /manual .*cannot carry a media query/);
  assert.equal(r.read("app/layout.jsx"), 'import "../styles/main.scss";\n', "entry untouched");
});

test("@import after a rule in a .css file is an error", (t) => {
  const r = run({
    "app/layout.jsx": 'import "../styles/late.css";\n',
    "styles/late.css": '.x{color:red}\n@import "./after.css";\n',
  }, ["--src", "."]);
  t.after(r.cleanup);
  assert.equal(r.code, 1);
  assert.match(r.out, /late\.css:2 .*comes after a rule/);
});

test("vendor @import in globals.css warns but passes; --allow silences it; tailwindcss never warns", (t) => {
  const files = {
    "app/layout.jsx": 'import "../styles/globals.css";\n',
    "styles/globals.css": '@import "tailwindcss";\n@import "./vendor-thing.css";\n.g{}\n',
  };
  const plain = run(files, ["--src", "."]);
  t.after(plain.cleanup);
  assert.equal(plain.code, 0);
  assert.match(plain.out, /warn .*vendor-thing\.css/);
  assert.doesNotMatch(plain.out, /tailwindcss" in a \.css/);

  const allowed = run(files, ["--src", ".", "--allow", "vendor-thing"]);
  t.after(allowed.cleanup);
  assert.match(allowed.out, /0 error\(s\), 0 warning\(s\)/);
});

test("preset after a LOCAL sheet is an error; after only package sheets it is a warning", (t) => {
  const local = run({
    "app/layout.jsx":
      'import "../styles/colors_and_type.css";\nimport "@devopsnext/starterkit-theme/presets/think.css";\n',
    "styles/colors_and_type.css": ":root{--x:1}\n",
  }, ["--src", "."]);
  t.after(local.cleanup);
  assert.equal(local.code, 1);
  assert.match(local.out, /overrides now LOSE to the preset/);

  const pkg = run({
    "app/layout.jsx":
      'import "@devopsnext/starterkit-button-component/styles.css";\nimport "@devopsnext/starterkit-theme/presets/think.css";\n',
  }, ["--src", "."]);
  t.after(pkg.cleanup);
  assert.equal(pkg.code, 0);
  assert.match(pkg.out, /warn .*harmless for package sheets/);
});

test("bootstrap-bridge before the .scss is an error", (t) => {
  const r = run({
    "app/layout.jsx":
      'import "@devopsnext/starterkit-theme/bootstrap-bridge.css";\nimport "../styles/style.scss";\n',
    "styles/style.scss": ".s{}\n",
  }, ["--src", "."]);
  t.after(r.cleanup);
  assert.equal(r.code, 1);
  assert.match(r.out, /bootstrap-bridge\.css must come AFTER/);
});

test("global sheet imported from a component warns; .module.css does not", (t) => {
  const r = run({
    "src/app/layout.jsx": 'import "./globals.css";\n',
    "src/app/globals.css": ".g{}\n",
    "src/components/C.jsx": 'import "../styles/stray.css";\nimport s from "./x.module.css";\n',
  });
  t.after(r.cleanup);
  assert.equal(r.code, 0);
  assert.match(r.out, /warn .*C\.jsx:1 .*stray\.css/);
  assert.doesNotMatch(r.out, /x\.module\.css/);
});

test("tsconfig paths alias is followed into the .scss", (t) => {
  const r = run({
    "tsconfig.json": '{ "compilerOptions": { "baseUrl": ".", "paths": { "~/*": ["./src/*"] } } }\n',
    "src/app/layout.tsx": 'import "~/styles/style.scss";\n',
    "src/styles/style.scss": "@import 'x.css';\n",
  });
  t.after(r.cleanup);
  assert.equal(r.code, 1);
  assert.match(r.out, /style\.scss:1 .*x\.css.*HOISTED/);
});

test("no entry found is an error, not a silent pass", (t) => {
  const r = run({ "README.md": "nothing here\n" });
  t.after(r.cleanup);
  assert.equal(r.code, 1);
  assert.match(r.out, /no root entry found/);
});
