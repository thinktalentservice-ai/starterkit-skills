# Migrating off the legacy hue ABI

Companion to [SKILL.md](../SKILL.md). SKILL.md carries the rule and the detection command; this file
carries the complete map and the fix procedure.

**Derived from evidence, not memory.** The legacy name list is every custom property in a real
old-ABI brand sheet that `isTokenName()` now rejects — 74 names. The family map is the rename that
actually shipped in the reference host (`src/app/globals.css`), cross-checked against the engine's own
comments (`src/engine/ladder.ts`, `spec.ts`, `presets/base.ts`) and against the RGB triples in the
old sheets.

## Why a mechanical find-and-replace is not enough

Three failure modes, all silent:

1. **A bare hue name did two jobs.** Old `--mint` was both the text colour and the mark. The new ABI
   splits those into `--primary-text` (4.5:1) and `--primary` (3.0:1). One old name, two new tokens —
   the right one depends on the call site.
2. **Three names survived the rename with a different meaning.** `--accent`, `--accent-text`,
   `--accent-border` and `--gradient-primary` are all valid today *and* existed before. Replacing
   `--mint` with `--accent` compiles, resolves, and paints the wrong hue with no error anywhere.
3. **A component axis value is a meaning, not a colour.** `variant="mint"` on a "deployed" badge
   became `success`, not `primary` — because what it meant was success. Renaming it by hue preserves
   the pixels and destroys the semantics.

So: the family word is mechanical, the suffix is a judgement, and a component axis is re-picked from
scratch.

## The family map

| legacy family | current role | evidence |
|---|---|---|
| `mint` | `primary` | `--mint-dark` was `palette.primary.dark`; the shipped rename maps `--color-mint → var(--primary)` |
| `electric` | `secondary` | the shipped rename; a replacement `secondary` inherits electric's geometry |
| `violet` | `secondary` | `--glow-violet` carries electric's exact RGB triple in both legacy sheets |
| `cobalt` | `accent` | "cobalt was the old alias for the THIRD brand hue, which the new ABI names `--accent`" |
| `amber` / `amber-brand` | `warning` | the shipped rename |
| `rose` | `danger` | the shipped rename |
| old `accent` | **`primary`** | old `accent` was an *alias of mint*, not an ancestor of today's `accent`. **See the trap below.** |
| `sky` | **culled** | no replacement; "four families nothing brandable ever drove" |
| `cyan` | **culled** | same |
| `pink` | **culled** | same |
| `terminal-green` | **culled** | same |

Old preset ids `obsidian` `atlas` `meridian` `solstice` `beacon` `graphite` are history, not API. The
catalogue is `think | elemetrik` — `PRESET_IDS`. (A live deployment may still *label* accounts with
strings like "obsidian · dark"; that is account metadata, not a preset id you can pass.)

### THE TRAP — `accent` means something different now

| name | meant, before | means, today |
|---|---|---|
| `--accent` | the brand hue = `--mint` | the **third** brand hue — a different family |
| `--accent-text` | mint's text rung | the third family's text rung |
| `--accent-border` | mint's decorative border | the third family's decorative border |
| `--gradient-primary` | `--brand-fill → --brand-fill-end`, i.e. mint blended into cyan — two *independent* client seeds | `--primary-solid → --primary-solid-hover`, one family |

`isTokenName()` returns `true` for every one of these, in both ABIs. Nothing catches them. A file that
used old `--accent` and was left alone is now painting the wrong family, and it looks intentional.

**When migrating a file that used old `--accent*`, the target is `--primary*`.**

## Tier A — mechanical, safe to auto-fix

The job is identical; only the family word moved.

| legacy | current |
|---|---|
| `--mint-text` `--electric-text` `--amber-text` `--cobalt-text` | `--primary-text` `--secondary-text` `--warning-text` `--accent-text` |
| `--mint-channel` `--electric-channel` `--amber-channel` `--rose-channel` `--cobalt-channel` | `--{primary,secondary,warning,danger,accent}-channel` |
| `--glow-mint` `--glow-violet` `--glow-amber` `--glow-cobalt` | `--glow-{primary,secondary,warning,accent}` |
| `--shadow-btn-mint` `--shadow-btn-violet` `--shadow-btn-cobalt` | `--shadow-btn-{primary,secondary,accent}` |
| `--gradient-mint` | `--gradient-primary` |
| `--gradient-amber` | `--gradient-warning` |
| `--gradient-cobalt` | `--gradient-accent` |
| `--brand-fill` | `--primary-solid` |
| `--brand-fill-end` | `--primary-solid-hover` |
| `--brand-fill-ink` / `--on-brand-ink` | `--primary-on-solid` |
| `--amber-fill` / `--amber-fill-end` / `--amber-fill-ink` / `--on-amber` | `--warning-solid` / `--warning-solid-hover` / `--warning-on-solid` / `--warning-on-solid` |
| `--cobalt-fill` / `--cobalt-fill-end` / `--cobalt-fill-ink` | `--accent-solid` / `--accent-solid-hover` / `--accent-on-solid` |
| `--on-mint` | `--primary-on-solid` |
| `--accent-fill` | `--primary-bg` |
| `--accent-glow` | `--glow-primary` |
| `--accent-border` (legacy sense) | `--primary-border` |
| `--mint-dark` | `--primary-solid-hover` |

`--mint-dark` is exact rather than a guess: it was `palette.primary.dark`, which is the hovered fill.

**Note the ink collapse.** `--on-mint`, `--on-amber`, `--brand-fill-ink`, `--amber-fill-ink` and
`--cobalt-fill-ink` all become `--{f}-on-solid`. The old sheet published one ink per fill; the new one
publishes one measured ink per family, scored against the worse of the resting and hovered fill.

## Tier B — family maps, you pick the suffix

The old suffix vocabulary was **per-family and inconsistent** — `mint` had soft/text/main/dark,
`electric` had light/text/main/deep, `cobalt` had five rungs, `amber` four, `rose` two. That
inconsistency is the reason the ABI was replaced; there is no suffix table to port.

The new ABI publishes exactly **two ramp rungs** — `--{f}-text` (slot 1) and `--{f}` (slot 2) — plus
two alpha derivatives, `--{f}-bg` (tint) and `--{f}-border` (decorative edge).

| legacy suffix | what it was | how to resolve it |
|---|---|---|
| `-soft` | a lighter ramp rung (index 0) | if it was a **tint background** → `--{f}-bg`; if it was a **light text colour** → `--{f}-text`; otherwise `--{f}` |
| `-light` | a lighter rung | same question |
| `-deep` | a darker rung | if it was the **hovered fill** → `--{f}-solid-hover`; if it was **text on a light surface** → `--{f}-text`; otherwise `--{f}` |
| `-dim` | a very low alpha of the family | `--{f}-bg`, or `rgb(var(--{f}-channel) / <your alpha>)` if you need the original alpha exactly |
| `-brand` | the pinned fill | `--{f}-solid` |
| bare hue (`--mint`) | text **and** mark, one token | **read the call site.** Words → `--{f}-text`. Border/icon/dot/chart stroke → `--{f}`. Filled background → `--{f}-solid` |
| `--{hue}-text-channel`, `--{hue}-deep-channel`, … | per-rung channels | gone. Only `--{f}-channel` (the mark's triple) exists. If you needed another rung's triple, you needed a different token |

**The bare-hue case is where most of the work is.** Go through the decision table in SKILL.md; do not
guess by which one looks closest.

## Tier C — culled, no replacement

`--sky` `--sky-channel` `--on-sky` `--cyan` `--pink` `--terminal-green`

There is no token to move to. These were families nothing brandable ever drove, and repointing them at
a surviving role invents a family nobody asked for. **Decide by what the thing means**, and record the
decision in a comment:

- a status or state → `success` / `warning` / `danger` / `info`
- a categorical colour that must not move per brand → `info`, `accent-green`, `accent-pink`, or a
  `--status-*` token
- the brand's own accent → `accent`
- nothing in particular → delete it and let the surface show through

Worked examples from the real migration:

| legacy | became | why |
|---|---|---|
| `variant="sky"` on a *rubric* badge | `accent` | sky is culled; rubric is a brand-coloured category |
| `variant="mint"` on a *deployed* badge | **`success`** | not `primary`. What it meant was success — the old palette simply had no green |
| `variant="cobalt"` on a feature card | `accent` | it carried `palette.info.main`; `accent` is the nearest role, explicitly *not* a guaranteed visual match |
| `--pink` on an error illustration | `--gradient-danger` | culled; danger is what the screen meant |
| `--terminal-green` | `--success` | culled; success is what it meant |

Note `variant="mint" → success` and `variant="cobalt" → accent`: **two call sites, same old hue
family, different new roles.** That is Tier C working correctly.

### Avatars

`--avatar-1 … --avatar-6` and `--avatar-{n}-bg` are gone. The replacement is a different mechanism —
three gradients, each with its measured ink:

`--gradient-avatar{,-from,-ink}` · `--gradient-avatar-2{,-ink}` · `--gradient-avatar-3{,-from,-ink}`

Six flat fg/bg pairs do not map onto three gradients. Re-pick, and always pair a gradient with its
`-ink`.

## The procedure

Do these in order. Steps 1–3 are mechanical; 4–5 are not.

**1. Find every occurrence.** From the repo root:

```bash
grep -rnE '(--|data-tone="|tone="|variant="|color="|\.glow-|\.text-gradient-)(mint|electric|violet|cobalt|amber|rose|sky|cyan|pink|terminal-green|brand-fill|on-brand-ink|avatar-[1-6])\b' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.css' --include='*.scss' --include='*.mjs' src | grep -v -- '--dd-'
```

**Repeat `--include` per extension.** A quoted brace glob (`'*.{js,css}'`) is not expanded by the
shell and not understood by grep's matcher: it matches zero files and prints nothing, which looks
exactly like a clean repo. Verified — the braced form returned 0 hits on a tree where the repeated
form returned 18.

**The `--dd-` exclusion is mandatory.** `--dd-amber` `--dd-blue` `--dd-cobalt` `--dd-green`
`--dd-orange` `--dd-red` `--dd-sky` `--dd-slate` `--dd-violet` are **current, valid** tokens — the
header-dropdown island keeps hue names on purpose, because it is a deliberately non-brandable light
panel. Rewriting them breaks a working component.

**2. Apply Tier A.** Straight replacement, no judgement.

**3. Apply the `accent → primary` rule** to every file that used the legacy ABI. This is the step
people skip, and it is the one that fails silently.

**4. Resolve Tier B by job**, one call site at a time, against SKILL.md's decision table. Border that
carries meaning → `--{f}`, never `--{f}-border`.

**5. Resolve Tier C by meaning**, not by hue. A component `tone=` / `variant=` / `color=` is a
semantic choice: re-derive it from what the element *is*, and leave a comment saying what the old
value was and why you chose the new one.

**6. Verify.** Re-run step 1 — it should return nothing outside comments. Then check every custom
property the code actually reads:

```bash
grep -rhoE 'var\(\s*--[a-z0-9-]+' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.css' --include='*.scss' src | sed -E 's/var\(\s*//' | sort -u | node -e "const{isTokenName}=require('@devopsnext/starterkit-theme');let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const n=s.split(/\r?\n/).filter(Boolean);const u=n.filter(x=>!isTokenName(x));console.log('used',n.length,'| not theme tokens',u.length);console.log(u.join('\n'))})"
```

Piped rather than routed through a temp file on purpose: `/tmp` in Git Bash on Windows and `/tmp` as
Node resolves it are not the same directory, so the two-step form silently reads a stale or missing
file.

Every name it prints is either a legacy leftover or belongs to another namespace. Expect and ignore:
`--bs-*` (Bootstrap), `--ib-*` (button package), `--ic-*` (card package), `--il-*` (layout package),
`--nf-*` (next/font), and your own app-owned names. Anything else that looks like a theme token is a
leftover.

**7. Look at it.** A wrong-but-valid token — the `accent` trap, a `-border` where `--{f}` belonged —
produces no error, no warning and no failing test. Both schemes, both presets.

## What does not need migrating

- `--dd-*` — 34 tokens, hue-named on purpose, light panel in both schemes.
- `--status-*` — categorical, fixed hexes, brand-independent. `--status-review` and `--warning` are
  the same amber today and mean different things; keep them separate.
- `--white-channel` / `--black-channel` — current.
- Anything under another package's namespace (`--ib-*`, `--ic-*`, `--il-*`).
