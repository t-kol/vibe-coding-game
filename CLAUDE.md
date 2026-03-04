# CLAUDE.md

## Purpose

This repository is actively developed and synced with GitHub.\
Claude is responsible for:

-   Making safe, atomic commits
-   Pulling before pushing
-   Handling merge conflicts carefully
-   Never rewriting history unless explicitly instructed
-   Keeping the repository in a stable, buildable state

Claude must behave like a cautious senior developer.

------------------------------------------------------------------------

## Core Git Rules

### 1. Always Check State First

Before making changes, Claude must run:

``` bash
git status
git branch
git remote -v
```

Never assume branch or remote.

------------------------------------------------------------------------

### 2. Always Pull Before Push

Before pushing any changes:

``` bash
git pull --rebase origin <current-branch>
```

If conflicts occur: - Stop - Explain the conflict clearly - Show
conflicting files - Propose resolution - Wait for confirmation before
continuing

Never auto-resolve silently.

------------------------------------------------------------------------

### 3. Commit Guidelines

Commits must:

-   Be atomic (one logical change per commit)
-   Have descriptive messages
-   Follow this format:

```{=html}
<!-- -->
```
    type(scope): short summary

    Longer explanation if needed.

Examples:

    feat(game): implement drift physics system
    fix(input): correct steering sensitivity bug
    refactor(engine): simplify collision handling
    docs(readme): update setup instructions

Claude must never commit: - .env - API keys - Secrets - Large
unnecessary binaries - node_modules (unless explicitly required)

------------------------------------------------------------------------

### 4. Safe Push Procedure

Standard push flow:

``` bash
git add .
git commit -m "message"
git pull --rebase origin <branch>
git push origin <branch>
```

If push is rejected: - Do NOT force push - Pull with rebase - Resolve
conflicts - Then push

Only use --force-with-lease if explicitly told to.

------------------------------------------------------------------------

### 5. Branching Rules

If working on new features:

``` bash
git checkout -b feature/<short-name>
```

Bug fixes:

``` bash
git checkout -b fix/<short-name>
```

Claude must: - Never commit directly to main unless instructed - Never
delete branches without permission - Suggest pull requests when
appropriate

------------------------------------------------------------------------

### 6. Merge Handling

When merging branches:

``` bash
git checkout main
git pull origin main
git merge <branch-name>
```

If conflicts occur: - Clearly explain: - What files conflict - Why they
conflict - The differences between versions - Propose a clean merged
result - Ask for approval before finalizing

Never auto-accept "ours" or "theirs" without explanation.

------------------------------------------------------------------------

### 7. Conflict Resolution Strategy

When resolving:

-   Preserve intentional changes
-   Avoid duplicate logic
-   Ensure the project still builds
-   Run tests if available
-   Provide a summary of what changed

After resolution:

``` bash
git add <resolved-files>
git rebase --continue   # if rebasing
# OR
git commit              # if merging
```

------------------------------------------------------------------------

### 8. Pull Request Discipline

When preparing for PR:

-   Ensure branch is up to date with main
-   No debug logs
-   No commented-out junk code
-   Clear commit history
-   Write PR summary including:
    -   What changed
    -   Why
    -   Any breaking changes

------------------------------------------------------------------------

### 9. Safety Constraints

Claude must NEVER:

-   Rewrite history without instruction
-   Use git push --force
-   Delete remote branches
-   Expose secrets
-   Assume default branch name (check it first)

------------------------------------------------------------------------

### 10. Recovery Strategy

If the repository becomes messy:

Check reflog:

``` bash
git reflog
```

Restore safely:

``` bash
git checkout <safe-commit>
```

Ask before hard reset.

------------------------------------------------------------------------
