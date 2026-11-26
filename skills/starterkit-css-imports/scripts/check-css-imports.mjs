#!/usr/bin/env node
/**
 * check-css-imports.mjs — static gate (and fixer) for where global stylesheets
 * are imported in a Next.js app. Zero dependencies: copy it into a project's
 * scripts/ and run it with plain Node 18+.
 *
 *   node scripts/check-css-imports.mjs                 # report, exit 1 on errors
 *   node scripts/check-css-imports.mjs --fix           # move hoisted CSS imports, then re-check
 *   node scripts/check-css-imports.mjs --entry src/app/layout.tsx --load-path src/styles
 *
 * THE RULE IT ENFORCES
 *   - The root entry (app/layout.* or pages/_app.*) is the ONE ordered list of
 *     global stylesheets. Next keeps CSS in import order within one module; that
 *     is the only order it promises.
 *   - A .scss file holds Sass only. A plain-CSS @import inside Sass — a target
 *     ending in .css, an http(s) URL, url(), or one carrying a media query — is
 *     NOT inlined where it is written. Sass emits it as a CSS @import HOISTED TO
 *     THE TOP of the compiled entry, so it loads before every rule above it in
 *     the source. That is the bug this gate exists for, and it is an ERROR.
 *   - A .css file's own @import (other than tailwindcss) is a WARNING: it is
 *     order-correct but invisible from the entry. An @import AFTER a rule is an
 *     ERROR: CSS requires @import first, so it is dropped or rejected.
 *   - Ordering checks that apply only when the file is present:
 *       * ERROR  a local stylesheet before @devopsnext/starterkit-theme/presets/<id>.css
 *                (its :root overrides lose to the preset); WARNING if only package sheets precede it;
 *       * ERROR  @devopsnext/starterkit-theme/bootstrap-bridge.css before a .scss import;
 *       * WARNING globals.css not the last stylesheet.
 *   - A global stylesheet imported from any other module is a WARNING: its
 *     position relative to the entry's list depends on chunking, not on source.
 *
 * --fix moves each hoisted Sass import to a JS import in the entry, placed
 * immediately BEFORE the import of the .scss entry that pulled it in. That is
 * where Sass was already loading it, so the fix changes no cascade order — it
 * makes the written order true. Remote URLs and media-queried imports are left
 * for a human and reported.
 *
 * BLIND SPOTS, printed on every run rather than hidden:
 *   - imports built at runtime (dynamic import(), require with a variable);
 *   - Sass load paths configured in next.config (sassOptions.loadPaths): pass
 *     them with --load-path or partials under them are not walked;
 *   - comments are stripped with a small tokenizer, not a full parser.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    root: { type: "string", default: "." },
    entry: { type: "string" },
    src: { type: "string" },
    "load-path": { type: "string", multiple: true, default: [] },
    allow: { type: "string", multiple: true, default: [] },
    fix: { type: "boolean", default: false },
    quiet: { type: "boolean", default: false },
  },
});

const ROOT = path.resolve(values.root);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const toPosix = (p) => p.split(path.sep).join("/");

/* ---------------------------------------------------------------- tokenizers */

/** Blank out JS comments, keeping every index and newline so positions map back. */
function stripJs(text) {
  const out = text.split("");
  let i = 0;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (c === "/" && n === "/") {
      while (i < text.length && text[i] !== "\n") out[i++] = " ";
    } else if (c === "/" && n === "*") {
      out[i] = out[i + 1] = " "; i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) { if (text[i] !== "\n") out[i] = " "; i++; }
      if (i < text.length) { out[i] = out[i + 1] = " "; i += 2; }
    } else if (c === '"' || c === "'" || c === "`") {
      i++;
      while (i < text.length && text[i] !== c) { if (text[i] === "\\") i++; i++; }
      i++;
    } else i++;
  }
  return out.join("");
}

/** Blank out CSS/Sass comments. `//` is a comment in .scss only; url(...) is opaque. */
function stripStyle(text, isSass) {
  const out = text.split("");
  let i = 0;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (c === "/" && n === "*") {
      out[i] = out[i + 1] = " "; i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) { if (text[i] !== "\n") out[i] = " "; i++; }
      if (i < text.length) { out[i] = out[i + 1] = " "; i += 2; }
    } else if (isSass && c === "/" && n === "/") {
      while (i < text.length && text[i] !== "\n") out[i++] = " ";
    } else if (c === '"' || c === "'") {
      i++;
      while (i < text.length && text[i] !== c && text[i] !== "\n") { if (text[i] === "\\") i++; i++; }
      i++;
    } else if (/^url\(/i.test(text.slice(i, i + 4))) {
      while (i < text.length && text[i] !== ")") i++;
      i++;
    } else i++;
  }
  return out.join("");
}

const lineOf = (text, idx) => text.slice(0, idx).split("\n").length;

/* ------------------------------------------------------------------ resolving */

function readAliases() {
  const aliases = [];
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    const file = path.join(ROOT, name);
    if (!existsSync(file)) continue;
    try {
      const json = JSON.parse(stripJs(readFileSync(file, "utf8")).replace(/,(\s*[}\]])/g, "$1"));
      const co = json.compilerOptions ?? {};
      const base = path.resolve(ROOT, co.baseUrl ?? ".");
      for (const [key, targets] of Object.entries(co.paths ?? {})) {
        if (!key.endsWith("/*") || !targets?.[0]?.endsWith("/*")) continue;
        aliases.push([key.slice(0, -1), path.resolve(base, targets[0].slice(0, -1))]);
      }
    } catch { /* malformed config: fall back below */ }
    if (aliases.length) break;
  }
  if (!aliases.some(([p]) => p === "@/")) {
    const src = path.join(ROOT, "src");
    aliases.push(["@/", existsSync(src) ? src : ROOT]);
  }
  return aliases;
}
const ALIASES = readAliases();

/** A JS import specifier → absolute path of a LOCAL file, or null for a package. */
function resolveJsSpec(spec, fromFile) {
  if (spec.startsWith("./") || spec.startsWith("../")) return path.resolve(path.dirname(fromFile), spec);
  for (const [prefix, dir] of ALIASES) if (spec.startsWith(prefix)) return path.join(dir, spec.slice(prefix.length));
  return null;
}

const LOAD_PATHS = values["load-path"].map((p) => path.resolve(ROOT, p));

/** Sass's partial resolution, local files only (packages are not walked). */
function resolveSass(spec, fromFile) {
  if (spec.startsWith("sass:")) return null;
  const clean = spec.replace(/^~/, "");
  for (const dir of [path.dirname(fromFile), ...LOAD_PATHS]) {
    const b = path.resolve(dir, clean);
    const d = path.dirname(b), name = path.basename(b);
    const cands = /\.(s[ac]ss|css)$/.test(b)
      ? [b, path.join(d, "_" + name)]
      : [`${b}.scss`, `${b}.sass`, path.join(d, `_${name}.scss`), path.join(d, `_${name}.sass`),
         path.join(b, "_index.scss"), path.join(b, "index.scss")];
    for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/* ------------------------------------------------------------------- parsing */

const STYLE_EXT = /\.(css|scss|sass)$/i;
const isGlobalSheet = (spec) => STYLE_EXT.test(spec.split("?")[0]) && !/\.module\.(css|scss|sass)$/i.test(spec);

/** Static imports in a JS/TS module: { spec, index, lineStart, line }. */
function jsImports(text) {
  const clean = stripJs(text);
  const re = /(^|[;\n])\s*import\s+(?:[\w$*{}\s,]+?\s+from\s+)?(["'])([^"'\n]+)\2/g;
  const found = [];
  let m;
  while ((m = re.exec(clean))) {
    // The `import` keyword itself. Not m.index + m[1].length: on a CRLF file that
    // lands on the "\r" of the PREVIOUS line, and the fix inserts one line early.
    const index = m.index + m[0].search(/import/);
    const lineStart = text.lastIndexOf("\n", index - 1) + 1;
    found.push({ spec: m[3], index, lineStart, line: lineOf(text, index), quote: m[2] });
  }
  return found;
}

function splitTopLevel(s) {
  const parts = []; let depth = 0, q = null, cur = "";
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim());
}

/** Classify one @import argument as Sass (inlined) or plain CSS (hoisted). */
function classifyArg(arg) {
  const str = arg.match(/^(["'])(.*?)\1\s*(.*)$/s);
  if (!str) return { target: arg, plain: true, why: /^url\(/i.test(arg) ? "url()" : "unquoted", remote: /^url\(/i.test(arg) };
  const [, , target, rest] = str;
  if (rest) return { target, plain: true, why: "media query", media: rest };
  if (/^(https?:)?\/\//i.test(target)) return { target, plain: true, why: "remote URL", remote: true };
  if (/\.css$/i.test(target)) return { target, plain: true, why: ".css target" };
  return { target, plain: false };
}

/** Every @import/@use/@forward statement: { kind, start, end, body, line, firstRuleBefore }. */
function styleStatements(text, isSass) {
  const clean = stripStyle(text, isSass);
  const out = [];
  const re = /@(import|use|forward)\b/g;
  let m;
  while ((m = re.exec(clean))) {
    let i = m.index + m[0].length, q = null, depth = 0;
    for (; i < clean.length; i++) {
      const ch = clean[i];
      if (q) { if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") q = ch;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if ((ch === ";" || ch === "\n" && !isSass) && depth === 0) break;
      else if (ch === "{" || ch === "}") break;
    }
    const end = clean[i] === ";" ? i + 1 : i;
    const before = clean.slice(0, m.index);
    out.push({
      kind: m[1], start: m.index, end, body: text.slice(m.index + m[0].length, clean[i] === ";" ? i : end).trim(),
      line: lineOf(text, m.index), firstRuleBefore: /[{}]/.test(before),
    });
    re.lastIndex = end;
  }
  return out;
}

/* --------------------------------------------------------------- entry + walk */

function findEntry() {
  if (values.entry) return path.resolve(ROOT, values.entry);
  for (const dir of ["src/app", "app", "src/pages", "pages"]) {
    const base = dir.endsWith("pages") ? "_app" : "layout";
    for (const ext of ["tsx", "jsx", "ts", "js"]) {
      const f = path.join(ROOT, dir, `${base}.${ext}`);
      if (existsSync(f)) return f;
    }
  }
  return null;
}

function walk(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".") || name === "out" || name === "dist") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, acc);
    else if (exts.test(name)) acc.push(full);
  }
  return acc;
}

function analyse() {
  const errors = [], warnings = [], hoisted = [];
  const ENTRY = findEntry();
  if (!ENTRY || !existsSync(ENTRY)) {
    errors.push({ where: "-", msg: "no root entry found (src/app/layout.*, app/layout.*, pages/_app.*); pass --entry" });
    return { errors, warnings, hoisted, ENTRY };
  }
  const entryText = readFileSync(ENTRY, "utf8");
  const sheets = jsImports(entryText).filter((imp) => isGlobalSheet(imp.spec));

  /* ordering inside the entry */
  // var() resolves at computed time, so a package sheet above the preset is harmless.
  // What breaks is a LOCAL sheet above it: the app's :root overrides then lose to
  // the preset's declarations of the same tokens.
  const presetIdx = sheets.findIndex((s) => /starterkit-theme\/presets\/[\w-]+\.css$/.test(s.spec));
  if (presetIdx > 0) {
    const localBefore = sheets.slice(0, presetIdx).find((s) => resolveJsSpec(s.spec, ENTRY));
    (localBefore ? errors : warnings).push({
      where: `${rel(ENTRY)}:${sheets[presetIdx].line}`,
      msg: localBefore
        ? `the theme preset comes after "${localBefore.spec}"; that sheet's :root token overrides now LOSE to the preset — put the preset first`
        : `the theme preset is stylesheet #${presetIdx + 1}; harmless for package sheets, but first is the convention gates assume`,
    });
  }
  const bridge = sheets.findIndex((s) => /starterkit-theme\/bootstrap-bridge\.css$/.test(s.spec));
  const lastScss = sheets.reduce((acc, s, i) => (/\.s[ac]ss$/.test(s.spec) ? i : acc), -1);
  if (bridge !== -1 && lastScss > bridge)
    errors.push({ where: `${rel(ENTRY)}:${sheets[bridge].line}`, msg: `bootstrap-bridge.css must come AFTER the .scss that compiles Bootstrap (${sheets[lastScss].spec}); before it, Bootstrap's :root --bs-* wins` });
  const globals = sheets.findIndex((s) => /(^|\/)globals\.css$/.test(s.spec));
  if (globals !== -1 && globals !== sheets.length - 1)
    warnings.push({ where: `${rel(ENTRY)}:${sheets[globals].line}`, msg: `globals.css is not the last stylesheet; app-wide rules usually go last` });

  /* walk each local stylesheet the entry imports */
  const seen = new Set();
  const visit = (file, entrySheet) => {
    if (seen.has(file + "|" + entrySheet.spec) || !existsSync(file)) return;
    seen.add(file + "|" + entrySheet.spec);
    const isSass = /\.s[ac]ss$/i.test(file);
    const text = readFileSync(file, "utf8");
    for (const st of styleStatements(text, isSass)) {
      const where = `${rel(file)}:${st.line}`;
      if (!isSass) {
        if (st.kind !== "import") continue;
        const target = (st.body.match(/^(["'])(.*?)\1/) ?? st.body.match(/^url\(\s*["']?([^"')]+)/i) ?? [])[2] ?? st.body;
        if (st.firstRuleBefore)
          errors.push({ where, msg: `@import "${target}" comes after a rule; CSS requires @import first, so it is dropped or rejected` });
        else if (!/^tailwindcss(\/|$)/.test(target) && !values.allow.some((a) => target.includes(a)))
          warnings.push({ where, msg: `@import "${target}" in a .css file is invisible from ${rel(ENTRY)}; import it there instead (or --allow ${target})` });
        const local = /^\.{1,2}\//.test(target) ? path.resolve(path.dirname(file), target) : null;
        if (local) visit(local, entrySheet);
        continue;
      }
      const args = st.kind === "import" ? splitTopLevel(st.body) : [st.body.match(/^(["'])(.*?)\1/)?.[2]].filter(Boolean).map((t) => `"${t}"`);
      for (const arg of args) {
        const a = classifyArg(arg);
        if (st.kind === "import" && a.plain) {
          errors.push({ where, msg: `plain-CSS @import of "${a.target}" (${a.why}) in Sass is HOISTED above every rule in ${entrySheet.spec}; import it from ${rel(ENTRY)} instead` });
          hoisted.push({ file, st, arg, a, entrySheet });
          continue;
        }
        const next = resolveSass(a.target, file);
        if (next) visit(next, entrySheet);
      }
    }
  };
  for (const s of sheets) {
    const local = resolveJsSpec(s.spec, ENTRY);
    if (local) visit(local, s);
  }

  /* global stylesheets imported from anywhere else */
  const srcDir = values.src ? path.resolve(ROOT, values.src) : existsSync(path.join(ROOT, "src")) ? path.join(ROOT, "src") : ROOT;
  for (const f of walk(srcDir, /\.(m?[jt]sx?)$/)) {
    if (f === ENTRY) continue;
    for (const imp of jsImports(readFileSync(f, "utf8")))
      if (isGlobalSheet(imp.spec))
        warnings.push({ where: `${rel(f)}:${imp.line}`, msg: `global stylesheet "${imp.spec}" imported outside ${rel(ENTRY)}; its cascade position depends on chunking, not on the entry's order` });
  }
  return { errors, warnings, hoisted, ENTRY, entryText, sheets };
}

/* ----------------------------------------------------------------------- fix */

function specFor(a, scssFile, entry, entryText) {
  const local = path.resolve(path.dirname(scssFile), a.target.replace(/^~/, ""));
  if (!a.target.startsWith("~") && existsSync(local)) {
    const usesAlias = /from\s+["']@\/|import\s+["']@\//.test(entryText);
    const alias = ALIASES.find(([p, dir]) => p === "@/" && local.startsWith(dir + path.sep));
    if (usesAlias && alias) return "@/" + toPosix(path.relative(alias[1], local));
    const r = toPosix(path.relative(path.dirname(entry), local));
    return r.startsWith(".") ? r : "./" + r;
  }
  return a.target.replace(/^~/, "");
}

function applyFix({ hoisted, ENTRY, entryText }) {
  const skipped = [];
  const byFile = new Map();
  const inserts = new Map(); // entry sheet lineStart -> [spec]
  const already = new Set(jsImports(entryText).map((i) => i.spec));
  for (const h of hoisted) {
    if (h.a.remote) { skipped.push(`${rel(h.file)}:${h.st.line} ${h.a.target} — remote URL; self-host the file (npm package or public/), then import it from ${rel(ENTRY)}. A CDN @import also needs a CSP style-src entry.`); continue; }
    if (h.a.media) { skipped.push(`${rel(h.file)}:${h.st.line} "${h.a.target}" ${h.a.media} — a JS import cannot carry a media query; wrap its rules in @media inside a .css file and import that from ${rel(ENTRY)}`); continue; }
    const spec = specFor(h.a, h.file, ENTRY, entryText);
    if (!byFile.has(h.file)) byFile.set(h.file, new Map());
    const stmts = byFile.get(h.file);
    if (!stmts.has(h.st)) stmts.set(h.st, []);
    stmts.get(h.st).push(h.arg);
    if (already.has(spec)) { skipped.push(`"${spec}" is already imported by ${rel(ENTRY)}; removed from ${rel(h.file)} only — check its position`); continue; }
    already.add(spec);
    const key = h.entrySheet.lineStart;
    if (!inserts.has(key)) inserts.set(key, { sheet: h.entrySheet, specs: [] });
    inserts.get(key).specs.push(spec);
  }

  /* 1. remove the moved args from each Sass file (from the end, so indices hold) */
  for (const [file, stmts] of byFile) {
    let text = readFileSync(file, "utf8");
    for (const [st, movedArgs] of [...stmts].sort((x, y) => y[0].start - x[0].start)) {
      const keep = splitTopLevel(st.body).filter((arg) => !movedArgs.includes(arg));
      if (keep.length) {
        text = text.slice(0, st.start) + `@import ${keep.join(", ")};` + text.slice(st.end);
        continue;
      }
      const ls = text.lastIndexOf("\n", st.start - 1) + 1;
      let le = text.indexOf("\n", st.end); if (le === -1) le = text.length;
      const rest = (text.slice(ls, st.start) + text.slice(st.end, le)).replace(/\/\/.*$/, "").trim();
      text = rest ? text.slice(0, st.start) + text.slice(st.end) : text.slice(0, ls) + text.slice(Math.min(le + 1, text.length));
    }
    writeFileSync(file, text);
    console.log(`fixed  ${rel(file)}: removed ${[...stmts.values()].flat().length} hoisted import(s) — re-read it for comments that described them`);
  }

  /* 2. insert JS imports immediately before the entry sheet that pulled them in */
  let text = readFileSync(ENTRY, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  for (const [lineStart, { sheet, specs }] of [...inserts].sort((a, b) => b[0] - a[0])) {
    const lineEnd = text.indexOf("\n", lineStart);
    const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const indent = line.match(/^[ \t]*/)[0];
    const semi = /;\s*$/.test(line.replace(/\/\/.*$/, "")) ? ";" : "";
    const block = specs.map((s) => `${indent}import ${sheet.quote}${s}${sheet.quote}${semi}${eol}`).join("");
    text = text.slice(0, lineStart) + block + text.slice(lineStart);
    console.log(`fixed  ${rel(ENTRY)}: +${specs.length} import(s) before "${sheet.spec}" (where Sass already loaded them)`);
  }
  if (inserts.size) writeFileSync(ENTRY, text);
  for (const s of skipped) console.log(`manual ${s}`);
}

/* ---------------------------------------------------------------------- main */

let result = analyse();
if (values.fix && result.hoisted.length) {
  applyFix(result);
  result = analyse();
}

const print = (label, list) => list.forEach((x) => console.log(`${label} ${x.where}  ${x.msg}`));
print("ERROR  ", result.errors);
if (!values.quiet) print("warn   ", result.warnings);
console.log(
  `\ncss-imports: ${result.errors.length} error(s), ${result.warnings.length} warning(s)` +
  (result.ENTRY ? ` — entry ${rel(result.ENTRY)}` : ""),
);
if (!values.quiet)
  console.log("blind spots: dynamic imports; Sass load paths not passed via --load-path; comment stripping is a tokenizer, not a parser.");
if (!values.fix && result.hoisted.length) console.log("hint: --fix moves the hoisted Sass imports into the entry without changing cascade order.");
process.exit(result.errors.length ? 1 : 0);
