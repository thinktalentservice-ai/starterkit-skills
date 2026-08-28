# starterkit-skills

Agent skills for the Think Talent frontend starter kits, installable with the
[`skills`](https://github.com/vercel-labs/skills) CLI.

## Install

```bash
# one skill, into the current project (./.claude/skills, ./.agents/skills, …)
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button

# several at once
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button --skill starterkit-config-util

# globally, for every project on this machine
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button -g

# see what is in here without installing anything
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --list

# target specific agents explicitly (otherwise the CLI detects what you have)
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-button -a claude-code -a cursor
```

`npx skills remove` uninstalls interactively.

## Skills

| Skill | Use when |
|---|---|
| [`starterkit-button`](skills/starterkit-button/SKILL.md) | Adding, restyling, reviewing or migrating any button, CTA, action row, toolbar control or link-styled-as-button; choosing a `variant=` / `tone=` / `fill=` string; installing or pinning `@devopsnext/starterkit-button-component`; or diagnosing a grey button, an unreadable label on a brand fill, or a translucent button that disappears. |
| [`starterkit-config-util`](skills/starterkit-config-util/SKILL.md) | Adopting, wiring, debugging or extending `@devopsnext/starterkit-config-util` — installing or pinning it, editing `src/config/*`, reading a config key, adding a health check, or diagnosing "every user appears signed out" / `undefined/oauth/authorize` / ignored `env.json` overrides. |

## Layout

The CLI discovers `SKILL.md` files up to three levels deep, so each skill is a
directory under `skills/`:

```
skills/
  <skill-name>/
    SKILL.md            # required: YAML frontmatter (name, description) + body
    references/         # optional: loaded on demand, keeps SKILL.md small
    scripts/            # optional: executable helpers
    assets/             # optional: templates, data
```

`name` in the frontmatter **must match the directory name**, and must be lowercase
letters, numbers and single hyphens.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter.
   Write the `description` as *when to use this*, with concrete triggering
   symptoms and keywords — that field is all an agent sees when deciding whether
   to load the skill. Do not summarise the workflow in it; agents will follow the
   summary instead of reading the body.
2. Keep `SKILL.md` under ~500 lines. Move long reference material into
   `references/` so it loads only when needed.
3. Verify discovery before pushing:
   ```bash
   npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --list
   ```
   A skill missing `name` or `description` is silently not found.
