# Stacked PRs for a page edit

Mechanics for shipping the [`edit-the-docs`](../SKILL.md) phases as a stack. Phase 0 decides how many branches you need. This file covers how to build and submit them.

## Branch names

One branch per change type, bottom to top:

| PR  | Branch                       |
| --- | ---------------------------- |
| 1   | `docs/<page>-style`          |
| 2   | `docs/<page>-structure`      |
| 3   | `docs/<page>-technical`      |
| 4+  | `docs/<page>-<what-it-adds>` |

The first three names are fixed, because there's one of each. **Additions get one branch per topic, named for the content it adds:** `docs/tables-rls` and `docs/tables-datatypes`, not `docs/tables-additions-1` and `-2`. Use `docs/<page>-additions` when a single branch carries all of them.

**Create only the branches whose buckets have content.** A two-branch stack is the common case. `gh stack init` takes however many you pass it.

**Use a category prefix and a short second segment.** Don't prefix a branch with an author name, even when a tracker suggests that format.

**Get every name right before you submit.** Renaming a branch that already has an open PR closes the PR rather than retargeting it, and a closed PR whose head ref is gone can't be reopened. Recovering costs the PR number and its CI history.

## Build the stack with gh stack

Never chain `gh pr create --base <previous-branch>`. That produces correct base branches but no GitHub stack. There's no stack number and no stack UI, so reviewers see several unrelated-looking PRs instead of one series.

1. `gh stack init <bottom> <middle> <top>` adopts existing branches, bottom to top. This is local only and makes no remote change.
2. `gh stack view` confirms the structure and shows the mapped PR for each branch.
3. `gh stack submit --auto` pushes and registers the stack on GitHub. Use `--auto` in a non-interactive session, where the editor can't open. New PRs are created as drafts unless you pass `--open`.

**Check the titles after submitting.** `submit` can title a PR from its branch name rather than its commit subject. Fix any that came out wrong with `gh pr edit <pr> --title`.

**Safe to re-run on PRs that already exist.** `submit` reports each one "up to date" and reuses it, so PR numbers, descriptions, and creation timestamps survive.

**Draft state doesn't reliably survive.** `--open` marks existing PRs ready for review, not just new ones, and a resubmit has been observed taking drafts out of draft without it. Check the draft state of every PR after submitting, and set it back with `gh pr ready --undo` if it moved.

**Other commands.** `gh stack link <pr> <pr> <pr>` registers the GitHub stack without local tracking. `gh stack unstack` removes a stack. The extension is `github/gh-stack`.

## Restacking after a change low in the stack

`gh stack rebase` replays every branch above the one you changed. Where a lower branch moved content that an upper branch also edited, git raises a conflict whose two sides are "the new structure" and "the old content being re-added". Resolving toward the new structure is usually right, and it silently drops the upper branch's edit along with the stale copy.

**Assume that happened. Audit rather than read the diff.** Before pushing, grep each branch for a marker of every change it is supposed to carry:

```bash
git show <branch>:<path> | grep -c '<marker>'
```

One marker per change, checked against the count you expect. A restructure large enough to conflict is large enough that reading the diff will not catch a missing paragraph.

Restore anything missing as a new commit on the branch that owns it, then rebase again. Don't fold it into a neighbouring branch to avoid a second rebase; that breaks the one-change-type-per-PR rule the stack exists for.

## Merge order

Merge bottom-up: `master`, then PR 1, then PR 2, then PR 3, then each additions branch in stack order. This is the model [`review-the-docs`](../../review-the-docs/SKILL.md) uses to review a stack, so the authoring and review sides share one vocabulary.

## PR bodies

Each body states which change type the PR carries and what it leaves to the PRs above it. That tells a reviewer the diff is narrow on purpose. Reworded prose isn't missing from the structure PR, it already landed below.

Carry forward anything you flagged while working: inferred claims from PR 3, gaps you named but didn't fill, and stale values you couldn't verify. Those belong in the description, not in the MDX.

For general PR-body mechanics, see [`create-pull-request`](https://github.com/supabase/docs-agent-skills/blob/main/.claude/skills/create-pull-request/SKILL.md).
