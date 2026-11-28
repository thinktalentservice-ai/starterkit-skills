# Install `starterkit-dev-debug`

## From this folder (works now, no push needed)

All projects on this machine:

```powershell
npx skills add C:\github\template\starterkit-skills --skill starterkit-dev-debug -g -a claude-code
```

Only the current project (run from its root):

```powershell
npx skills add C:\github\template\starterkit-skills --skill starterkit-dev-debug -a claude-code
```

## From GitHub (only after this skill is merged into `main` and pushed)

Use this on other machines.

```powershell
npx skills add https://github.com/thinktalentservice-ai/starterkit-skills --skill starterkit-dev-debug -g -a claude-code
```

## Check

```powershell
npx skills list -g
```

## Use

1. Open a project in Claude Code and ask: **"set up dev-debug here"**.
2. Tell it the login host used only for development, and whether `.env.debug.local`
   should be committed for other developers (it stays ignored unless you say so).
3. Fill `DEBUG_USERNAME` and `DEBUG_PASSWORD` in `.env.debug.local` yourself.
   Use a debug-only account.
4. Start the dev server and run `/dev-debug`.

Needs Node 18+, PowerShell 7 (`pwsh`) and `playwright-cli`.

## Update after editing the skill here

Run the install command again.

## Uninstall

```powershell
npx skills remove starterkit-dev-debug -g
```
