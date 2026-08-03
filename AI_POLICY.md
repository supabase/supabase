Supabase AI Contribution Guidelines

We love AI and use it a lot. But a public repo is a shared surface area: low-confidence AI output pushes quality work onto maintainers and slows everyone down. So yes to AI, no to sloppy, unverified PRs.

1) Disclosure

If AI helped in any meaningful way, say so in the PR description. Include:

- what the tool did (drafted code, refactor, tests, docs, investigation, etc.)
- what you personally verified (and how)

Example:

> AI assistance: Claude Code
> Used it to scaffold component X based on component Y.
> I ran it locally and verified behavior end-to-end.
> Claude generated initial tests; I reviewed and adjusted assertions.
> I rewrote error handling and validated on Postgres 15 + RLS.

Undisclosed AI usage may result in the PR being closed.

2) No drive-by AI PRs

No drive-by AI feature drops. No speculative “this might be useful” contributions.

If you have an idea, start with a discussion (or an issue) and get buy-in before writing code. This keeps maintainers reviewing solutions, not debating product direction.

3) Human verification

You are responsible for the code in your PR. Not the model, and not the maintainer.

Before opening a PR, you must:

- run the code
- test behavior and clearly describe what you tested
- understand why the change works
- confirm it matches Supabase patterns
- check common edge cases (RLS, multi-tenant behavior, nullability, errors)
- If you can’t explain the change, don’t submit it.

4) Human-written text only

AI-written text tends to be verbose and confidently wrong. If you used AI to draft any text (issue, discussion, PR description, docs), you must edit it before posting:

- remove filler
- verify claims
- include concrete steps to reproduce issues (when applicable)

We want PR descriptions written by you. Maintainers should understand what the PR does and why from your words.

5) Respect maintainer time

Every PR is reviewed by humans. Low-effort AI submissions create hidden work:
reading → validating → testing → correcting → explaining.