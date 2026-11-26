# starterkit-skills

Agent skills for the Think Talent frontend starter kits (the
`@devopsnext/starterkit-*` packages) and SunEditor v3, installable with the
[`skills`](https://github.com/vercel-labs/skills) CLI.

A skill gives a coding agent what it needs to use a library correctly: how to
install and wire it, which options to choose, and how to diagnose the failures
that do not announce themselves, such as a build that passes while the page is
wrong.

## Quick start

```bash
# see what is in here without installing anything
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --list

# install one skill into the current project
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button
```

Other install options:

```bash
# several at once
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-theme --skill starterkit-layout

# every skill (you are still asked about agents and scope)
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill '*'

# globally, for every project on this machine
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button -g

# target specific agents (otherwise the CLI detects what you have)
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button -a claude-code cursor
```

Once installed, there is nothing to invoke by hand: the agent loads a skill when
your request matches its description.

## Skills

"Written against" is the library version each skill documented at the time of
this README's last update. Each skill's name links to its `SKILL.md`, whose
frontmatter `description` lists the full set of triggers and symptoms.

### UI and theming

| Skill | Written against | Use it for |
|---|---|---|
| [`starterkit-theme`](skills/starterkit-theme/SKILL.md) | `starterkit-theme` 1.7.0 | Colour, gradient, shadow, radius, focus ring and font tokens; light/dark mode, MUI theme and brand presets; migrating legacy hue names. |
| [`starterkit-layout`](skills/starterkit-layout/SKILL.md) | `starterkit-layout` 1.7.0 | The dashboard shell: topbar, sidebar, navigation, header dropdowns, profile menu, footer, mobile drawer and brand marks. |
| [`starterkit-button`](skills/starterkit-button/SKILL.md) | `starterkit-button-component` 2.8.2 | Buttons, CTAs, action rows, toolbar controls and link-styled buttons. |
| [`starterkit-card`](skills/starterkit-card/SKILL.md) | `starterkit-card-component` 2.3.1 | Cards, panels, tiles, KPI blocks and clickable content surfaces. |
| [`starterkit-table`](skills/starterkit-table/SKILL.md) | `starterkit-table` 0.1.0 | Data tables on `material-react-table`: filtering, selection, row and bulk actions. |
| [`starterkit-skeleton-loader`](skills/starterkit-skeleton-loader/SKILL.md) | `starterkit-skeleton-loader` 0.2.1 | Loading states and skeletons with `<AutoSkeleton>`, including project-wide capture. |
| [`starterkit-css-imports`](skills/starterkit-css-imports/SKILL.md) | Next.js 16.4, `sass-embedded` 1.108, Tailwind 4.3 | Where each global stylesheet is imported (`layout.jsx`, `style.scss`, `globals.css`), with a gate that finds and fixes Sass-hoisted CSS imports. |

### App behaviour

| Skill | Written against | Use it for |
|---|---|---|
| [`starterkit-config-util`](skills/starterkit-config-util/SKILL.md) | `starterkit-config-util` 0.4.1 | Runtime config, `env.json`, per-host service URLs, third-party integrations, health checks and CSP gates. |
| [`starterkit-intro`](skills/starterkit-intro/SKILL.md) | `starterkit-intro` 0.1.1 | Per-page product tours and "Take a tour" buttons, with a CI gate for renamed tags. |

All packages above are published under the `@devopsnext/` npm scope.

### Editor

| Skill | Written against | Use it for |
|---|---|---|
| [`suneditor-v3`](skills/suneditor-v3/SKILL.md) | `suneditor` 3.4.3 | SunEditor v3 in React/Next.js, and migrating from 2.x or `suneditor-react`. |

## Versions and staleness

A skill is a snapshot. Check the version your project has installed and the
latest one published before trusting a table of props, tokens or options:

```bash
npm view @devopsnext/starterkit-theme version
```

Several `starterkit-*` skills have a "Staleness" section explaining how to
re-derive their tables from a newer release. If a skill and the installed
package disagree, the package is right.

## Bundled scripts

Two skills ship a setup script. Run it from the root of **your** project, where
`<skill-dir>` is wherever the skill was installed. Both accept `--dry-run` and
`--force`, and neither installs dependencies.

| Script | What it adds to your project |
|---|---|
| `node <skill-dir>/scripts/setup-capture.mjs` (`starterkit-skeleton-loader`) | The `skeleton:capture` and `skeleton:list` package scripts, plus the capture script they run. |
| `node <skill-dir>/scripts/setup-intro.mjs` (`starterkit-intro`) | The `lint:intro` gate and, for the Next.js App Router, `intro:list` and `intro:capture`. |

`starterkit-css-imports` ships a checker instead: `node <skill-dir>/scripts/check-css-imports.mjs`
reports misplaced stylesheet imports and exits 1 on errors, and `--fix` moves Sass-hoisted CSS
imports into the layout without changing cascade order. It has no dependencies; copy it into your
project's `scripts/` to use it as a `lint:css-imports` gate. Its regression tests run with no install:

```bash
node --test skills/starterkit-css-imports/tests/check-css-imports.test.mjs
```

Run them after any change to the checker.

## Managing installed skills

```bash
# list installed skills (add -g for global ones)
npx skills list

# update one skill in place, rather than re-adding it
npx skills update starterkit-button

# update installed skills (-g global only, -p project only, -y skip the scope prompt)
npx skills update

# uninstall interactively
npx skills remove
```

## Repository layout

Each skill is a directory under `skills/`:

```
skills/
  <skill-name>/
    SKILL.md            # required: YAML frontmatter + body
    references/         # optional: loaded on demand, keeps SKILL.md small
    scripts/            # optional: executable helpers
```

## Adding or updating a skill

1. Create `skills/<name>/SKILL.md`. `name` in the frontmatter **must match the
   directory name**: lowercase letters, numbers and single hyphens.
2. Write the `description` as *when to use this*, with concrete triggering
   symptoms and keywords. That field is all an agent sees when deciding whether
   to load the skill. Do not summarise the workflow in it; agents will follow the
   summary instead of reading the body.
3. Follow the other skills' frontmatter: `license`, `compatibility`, and
   `metadata` with `author` and `version`.
4. Aim for under ~500 lines in `SKILL.md`. Move long reference material into
   `references/` so it loads only when needed.
5. Record the library version the skill was written against. When you move it to
   a newer release, update the table above too.
6. Verify discovery from your local checkout before pushing:
   ```bash
   npx skills add . --list
   ```
   A skill missing `name` or `description` is silently not found.

## License

[MIT](LICENSE)
