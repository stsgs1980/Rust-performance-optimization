# Agent Rules

Mandatory rules for AI agents working on this project. Read before starting work.

---

## 0. Onboarding Protocol

When entering this project (new chat, session restart, context loss),
you MUST complete the onboarding protocol before starting any work:

1. Read `AGENT_RULES.md` (this file)
2. Read `worklog.md` (previous session history)
3. Check git state: `git log --oneline -10` and `git status`
4. Verify dev server: `curl http://127.0.0.1:3000`
5. Scan project structure: `instructions/`, `skills/`, `src/app/`
6. Report current state to user

See `instructions/onboarding-protocol.md` for full details.
NEVER start coding or modifying files before completing Steps 1-3.

## 1. Language Rule

Always respond in the user's language. If the user writes in Russian, respond in Russian. If in English, respond in English. Never switch languages without explicit request.

- Code, file paths, terminal commands, git commit messages - always English
- Chat messages, explanations, worklog - match user's language
- Before each response verify: "Am I writing in the same language as the user?"

## 2. Git Workflow Rules

### 2.1 Backup Before Rewrite

Before any git operation that rewrites history (rebase, merge, pull, reset --hard):

1. `git stash push -m "pre-op-backup"`
2. `cp -r src/ /tmp/src-backup/`
3. `git log --oneline -20 > /tmp/git-log-backup.txt`

### 2.2 Force Push Over Rebase

When `git push` is rejected (diverged branches):

- `git push --force origin main` - CORRECT
- `git pull --rebase` - FORBIDDEN (blocks sandbox environment on conflict)

### 2.3 Never Pull After Remote URL Change

After `git remote set-url origin <url>`:

- `git push --force origin main` - CORRECT
- `git pull` - FORBIDDEN (creates unnecessary conflicts)

### 2.4 No Panic Diagnostics

Before telling the user data is lost, check ALL 5 paths:

1. `ls src/app/` - do files exist?
2. `ls .git/rebase-merge/` - is rebase paused?
3. `git reflog` - are commits referenced?
4. `ls /tmp/src-backup-*/` - were backups created?
5. `git fsck --lost-found` - dangling objects?

NEVER say "permanently lost" until all 5 checks are exhausted.

### 2.5 Log Everything

After every git operation, log to `worklog.md`: operation, hash before/after, result.

## 3. Dev Server Rules

- Use `npx next dev -p 3000` directly (NOT `bun run dev`)
- Use `127.0.0.1 not `localhost` for curl
- Redirect output: `</dev/null >/tmp/zdev.log 2>&1 &`
- Wait 6 seconds before health check (Turbopack compile time)
- If server returns 500: check logs, fix error, then restart (don't blindly restart)

## 4. Code Standards

- No-Unicode Policy v2.0 [C] - zero non-Cyrillic non-ASCII in UI code
- MARKDOWN_STANDARD v2.0 [W] - ASCII + Cyrillic only in .md files
- REPRODUCIBILITY-STANDARD - `.env.example` required, relative paths only
- Use shadcn/ui components, do not build from scratch
- TypeScript throughout with strict typing

## 5. Diagnostic Disclosure

Severity ladder for communicating problems:

| Certainty | Phrase |
|-----------|--------|
| File exists | "File X is present, Y lines" |
| Not found | "File X not found, checking alternatives..." |
| All checks exhausted | "File X not found after exhaustive search. Options: A, B, C" |
| All recovery failed | "File X could not be recovered. You may need to recreate it." |

Never jump to the last row without passing through all previous rows.

## 6. Skills to Use

| Skill | When to Use |
|-------|-------------|
| `git-safe-ops` | Before any git push/pull/rebase/merge with remote |
| `dev-watchdog` | Starting, restarting, or checking dev server |

## 7. Instructions to Follow

| Instruction | File |
|-------------|------|
| Onboarding Protocol | `instructions/onboarding-protocol.md` |
| Git Workflow Rules | `instructions/git-workflow-rules.md` |
| Language Rule | `instructions/language-rule.md` |
| Diagnostic Disclosure | `instructions/diagnostic-disclosure.md` |

---

Built with: Next.js 16 + TypeScript + Tailwind CSS
