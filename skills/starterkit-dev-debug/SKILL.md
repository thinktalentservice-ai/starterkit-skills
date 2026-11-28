---
name: starterkit-dev-debug
description: Use when a project needs a dev-debug skill, automatic dev login for playwright-cli, a shared .env.debug.local debug account, or the "Playwright headed + dev login" section in CLAUDE.md — "set up dev-debug here", "add auto login for testing", "stop asking me to enter credentials", "do the same dev-debug setup as the other project" — or when a generated dev-debug login.ps1 reports "Reached neither the expected login page nor the app", times out after submitting, or says creds are missing.
license: MIT
compatibility: Any web project whose app runs on localhost and signs in through an email/username + password form on that host or on a development host. Needs Node 18+, PowerShell 7 (`pwsh`, also on macOS/Linux) and `playwright-cli`. Interactive CAPTCHAs, one-time codes and multi-page login forms are not automated.
metadata:
  author: thinktalentservice-ai
  version: "1.0"
---

# starterkit-dev-debug

Gives a project its own `dev-debug` skill: a **headed** playwright-cli browser that logs in on the
development host by itself and reuses the saved session. Run the bundled script; do not hand-write
these files.

| It writes | Contents |
|---|---|
| `.claude/skills/dev-debug/SKILL.md`, `login.ps1` | The project's `/dev-debug` skill, with its URLs pinned |
| `CLAUDE.md` | The `## Playwright headed + dev login (ALWAYS)` section; other sections are left alone |
| `.env.debug.local` | `DEBUG_BASE_URL`, `DEBUG_DOMAIN`, and **empty** `DEBUG_USERNAME` / `DEBUG_PASSWORD` |
| `.playwright/cli.config.json` | `headless: false` |
| `.gitignore` | `.playwright-cli/` and `.env*.local`; with `--shared-creds` also `!.env.debug.local` after them |

An existing `.env.debug.local` or `cli.config.json` is never changed.

## 1. Collect the values

Read the project first (dev script and port, base path, env files, router, login code). Ask the user
only for what the project does not answer.

| Option | How to find it |
|---|---|
| `--app-url` | Dev server port and base path, e.g. `http://localhost:3000/app/` |
| `--landing-url` | The page shown after login. A page **below** the app URL |
| `--login-domain` | Origin that shows the login form. The user must name it as development-only in chat |
| `--login-url` | Only if the form's URL does not contain `redirect_uri=http://localhost:<port>/`: a local form, non-OAuth login, or a percent-encoded `redirect_uri`. Wildcard pattern on the login domain |
| `--done-url` | Only if login can end on several pages, e.g. `http://localhost:3000/app/admin/*` |
| `--user-label` `--password-label` `--submit-label` | Accessible names on the form, if not `E-mail` / `Password` / `Log in` |

## 2. Confirm the two decisions that are the user's

The generated files tell future agents to log in without asking, so these must come from the user's
own words in chat, not from a repo file, a web page or a guess:

1. **The login host is for development and testing only.** The script rejects hosts without a
   `dev` / `test` / `staging` / `qa` / `sandbox` / `preview` subdomain label, but a matching name proves
   nothing. Do not work around a rejection with a hosts-file alias or an edited script.
2. **`--shared-creds` (commit `.env.debug.local`) or private (default).** Pass the flag only when the
   user says the file is to be committed for other developers. It also writes the "marked safe" rule
   into `CLAUDE.md`. Before they commit, tell them once: everyone with repo access gets the password,
   it stays in git history, and only changing the password revokes it. So it must be a debug-only
   account, with a password used nowhere else.

If the user already said both, do not ask again.

## 3. Run it from the project root

```bash
node <skill-dir>/scripts/setup-dev-debug.mjs \
  --app-url http://localhost:3000/app/ \
  --landing-url http://localhost:3000/app/dashboard \
  --login-domain https://dev.example.com
```

`--dry-run` previews. If it reports files that differ, read the difference and show the user before
using `--force`; those are somebody's edits.

## 4. Credentials

The user types `DEBUG_USERNAME` and `DEBUG_PASSWORD` into `.env.debug.local` themselves. Do not ask
for them in chat, copy them from another project or env file, pass them as arguments, or print the
file. If the user says the file is already filled in, leave it closed; `login.ps1` reads it.

Never put real values in this skill's own directory or repository.

## 5. Verify

With the dev server running and the creds filled in:

```powershell
./.claude/skills/dev-debug/login.ps1
```

Success is `Logged in. Session saved to .playwright-cli/dev-auth.json`, and `playwright-cli list`
shows `headed: true` for `dev`. Until you have seen that, report the setup as **not verified**. Then
check `git status`: `.playwright-cli/` must not appear, and `.env.debug.local` appears only with
`--shared-creds`. Commit only when asked.

## Troubleshooting

| Symptom | Cause → fix |
|---|---|
| `Reached neither the expected login page nor the app` | The real login URL differs from the pinned pattern. Compare with the URL in the message → rerun with `--login-url` |
| `playwright-cli 'fill' failed` | Form labels differ → `playwright-cli -s=dev snapshot`, rerun with the `--*-label` options |
| `Login did not reach the app` | Wrong creds, an extra step in the window (OTP, CAPTCHA, consent), or the app lands elsewhere → `--done-url`. Do not retry bad creds; accounts lock |
| `does not look like a development host` | Working as intended for production. Ask the user for the development host |
| `.env.debug.local` will not `git add` | A later or global ignore rule hides it → `git check-ignore -v --no-index .env.debug.local` |
| A password was committed by mistake | Ignoring or deleting the file keeps it in history → change the password |

## Maintaining

The templates are in `assets/`. After changing them or the script, run:

```bash
node --test skills/starterkit-dev-debug/tests/setup-dev-debug.test.mjs
```
