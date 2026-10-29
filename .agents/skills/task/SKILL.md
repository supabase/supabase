---
name: task
description: Carry out repository development tasks through planning, implementation, independent QA and code review, and an authorized draft PR with verified CI. Use for features, bug fixes, and refactors; respect review-only and local-only requests.
---

# Development Task

## Scope and roles

Honor the requested deliverable. Questions and explicit review-only requests do not authorize implementation; route reviews to [code-review](../code-review/SKILL.md). Local-only work ends with local verification. This workflow does not independently authorize pushes, PRs, publishing, merging, or messages to others. Use authorization already given in the session without asking again.

Read the root [AGENTS.md](../../../AGENTS.md), applicable nested instructions, and relevant domain skills before planning. Inspect the branch, base, and working tree before Git operations. Preserve unrelated edits when creating an authorized feature branch; do not discard changes or switch away from unfinished work to make the workspace clean.

When delegation is available, the primary plans and independently verifies; a worker owns implementation, including source, tests, configuration, formatting, and review fixes. Give each worker explicit file ownership, acceptance criteria, verification expectations, and notice that others share the workspace and their edits must be preserved. Assign source and test responsibilities explicitly, even when one worker owns both.

If agents are unavailable, perform distinct implementation, QA, and review passes. Disclose that they were performed by the same agent; do not claim independent review.

## 1. Plan

Establish the intended behavior from the request and connected code. Identify affected surfaces, callers, risks, and acceptance criteria. Share a concise plan and proceed within the authorized scope. Ask only for missing information that affects correctness; continue independent work when possible.

Select checks from the actual package scripts, configuration, and CI workflows for the affected paths. Plan meaningful behavioral coverage rather than tests that duplicate types, constants, framework behavior, or existing assertions. For Studio, use [studio-testing](../studio-testing/SKILL.md); for docs changes, use [review-the-docs](../review-the-docs/SKILL.md).

## 2. Implement

Make the smallest coherent change that meets the acceptance criteria. Reuse the module that owns the concept before adding helpers or abstractions. Keep unrelated improvements out of the task.

Use small, focused commits when commits are in scope: each contains one independently reviewable change. Preserve others' edits and stage only the intended files or hunks. Do not accumulate unrelated implementation, tests, configuration, and formatting into a final catch-all commit.

Do not add agent attribution to commits or PRs unless requested.

The worker reports changed files, exact check commands and outcomes, and unresolved concerns. This report informs verification; it does not replace the primary's checks.

## 3. Verify and review

The primary inspects the complete diff and connected code, checks every acceptance criterion, runs appropriate QA, and follows [code-review](../code-review/SKILL.md) in readiness mode. Use an independent reviewer when available. For visible behavior, exercise the relevant user flow and capture evidence when the environment permits it.

Return fixes to the implementation worker. After each fix, review the new diff and rerun affected checks. Reuse earlier evidence only when it still covers the current changes. Do not weaken checks, remove useful coverage, add retries, or skip failures to obtain a pass.

Record missing dependencies, unavailable previews, permissions, and external service failures as blockers. Distinguish an incomplete check from a product failure; neither is a passing result.

## 4. Deliver within scope

For an authorized PR, detect the actual base branch and inspect the full branch diff before pushing. Follow any repository PR template. Explain the problem, resulting behavior, and verification in plain language; include limitations and useful UI evidence without private data. Create a draft PR and keep it draft unless the user requests otherwise. Attach or link the PR using available integration tools.

Verify the PR's latest head SHA and applicable check results directly. Pending, missing, cancelled, failed, skipped, and neutral checks are not passes. A path-filtered check can be inapplicable only when its configuration and changed paths establish that; disclose the reason. Do not bypass an unavailable required service or claim earlier-head CI verifies later edits.

Address in-scope review feedback and CI failures, then repeat affected QA and review and verify CI on the new head. Publishing a review, posting comments, marking ready, or merging requires its own applicable authorization.

Finish with the requested artifact, concise verification evidence, and any remaining blockers. PR work is complete when QA and review pass, the draft PR exists, and all applicable checks pass on its latest head. Local-only work is complete when its acceptance criteria and applicable local checks pass; no PR is required.
