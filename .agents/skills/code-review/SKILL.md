---
name: code-review
description: Review repository changes for correctness, type boundaries, structural quality, and meaningful test coverage. Use for read-only code or PR assessments and development-task readiness checks.
---

# Code Review

## Select the mode and target

**Read-only assessment:** use for explicit reviews and audits. Resolve the requested PR, branch, commit, or file scope; otherwise inspect current changes against the actual base branch. If neither changes nor a clear target exist, ask for the target. Do not edit, format, mutate source for testing, push, open a PR, or publish review comments. Run only checks compatible with the requested scope.

**Readiness:** use when verifying implementation as part of an authorized development task. Follow [task](../task/SKILL.md) for implementation ownership and delivery scope. Delegate fixes, formatting, and temporary source mutations to the implementation worker when available. Review every later fix and repeat affected checks before claiming readiness.

Read the applicable [AGENTS.md](../../../AGENTS.md) instructions and domain skills. Inspect the complete diff, stated intent, surrounding code, relevant callers, tests, and available check results. A summary or author report is not a substitute for reading the change.

## Correctness and boundaries

Trace changed inputs through their observable effects. Check async sequencing and rejection paths, nullable values, indexing and pagination, state updates, removed guards, permissions, and callers affected by changed exports or contracts. Identify concrete failing scenarios rather than speculative defensive requirements that contradict established API guarantees.

At external boundaries such as HTTP, parsed JSON, route parameters, storage, and callbacks, verify how values become trusted domain data. Keep useful inferred types and validate untrusted inputs where the contract requires it. Flag broad types propagated inward, assertion chains, non-null assertions, or unsafe casts when they hide an unproven invariant. `unknown` and runtime narrowing are appropriate at genuine boundaries; do not ban them mechanically or add a schema library without need.

Explain any surviving type assertion's invariant in the review evidence. Do not weaken types, suppress errors, or route values through `any` to make checks pass. Static typechecking and passing runtime tests provide different evidence.

## Structure and readability

Prefer the smallest change that clarifies the behavior. Check whether a refactor reduces states and branches or merely moves complexity behind wrappers. Keep feature logic with its owning module and reuse canonical utilities.

Flag scattered special cases, duplicate domain contracts, pass-through abstractions, and generic mechanisms that obscure simple data flow. Extract helpers or name complex conditions when doing so reduces the reader's reasoning burden. Similar-looking code alone does not justify an abstraction; prioritize high-impact structural problems over cosmetic nits.

Keep transformations and business rules independently understandable without extracting every expression from a component. Follow domain-specific composition conventions where they apply.

Prefer self-explanatory names and structure. Avoid comments that restate the code or narrate change history; history belongs in commits and PRs. Preserve domain-required annotations and semantic tooling directives.

## Meaningful coverage

For Studio, follow [studio-testing](../studio-testing/SKILL.md) for test selection and location, [studio-mock-api-tests](../studio-mock-api-tests/SKILL.md) for network-backed component tests, and [studio-e2e-tests](../studio-e2e-tests/SKILL.md) for E2E execution. Use [vitest](../vitest/SKILL.md) for runner details. For docs, follow [review-the-docs](../review-the-docs/SKILL.md) and use [test-the-docs](../test-the-docs/SKILL.md) when runnable snippets need verification.

Each new test should protect a meaningful behavior or plausible regression. Prefer observable outcomes and representative failures over private state, DOM structure, class names, or whole-tree snapshots. Reuse real definitions and existing fixtures when suitable, while keeping expected outcomes independent of the implementation's calculation.

Inspect changed tests and nearby coverage for duplicates, assertions that cannot fail, unawaited async checks, and mocks that replace the integration being verified. Preserve distinct boundary, error, historical-data, and safety cases. Rewrite brittle coverage around the meaningful contract before removing its only assertion. Do not add tests solely for static configuration, type guarantees, framework internals, or coverage percentages.

## Verification evidence

Choose formatting, lint, typecheck, build, and test commands from the affected package's actual scripts and CI configuration. Check changed files with the repository's Prettier configuration. Do not assume an unscoped root `tsc` validates every package. Record commands, scope, and outcomes; distinguish checks run personally from CI results and author claims.

In readiness mode for executable behavior:

1. Run relevant existing tests with retries disabled. Diagnose failures as behavioral, dependency, environment, or infrastructure issues; blocked runs are not passes.
2. Repeat affected tests and shuffle with recorded seeds where timing, shared state, order dependence, or observed instability makes flakiness a concern. Fix the cause instead of masking failures with retries or skips.
3. For new or changed behavioral tests and regression-critical coverage, prove the important assertion detects broken behavior. Prefer reproducing the original bug before the fix when available. Otherwise use a focused, realistic temporary mutation of the affected behavior, such as omitting a required side effect. A compile error, timeout, or infrastructure failure does not demonstrate a behavioral assertion.
4. Before mutating, save exact source bytes and guarantee restoration even on failure, preserving unrelated edits. Coordinate ownership to prevent concurrent writes. Restore source, confirm the intended diff remains, and rerun the affected clean tests. Repair meaningful coverage that survives the probe, then repeat it.

This is a focused check of important behavioral coverage, not a repository-wide mutation campaign. For docs or configuration without executable behavior, explain why execution or mutation is inapplicable; do not invent tests to satisfy a gate. In read-only mode, inspect available evidence and report gaps without source mutations.

Verify required CI against the latest head when CI is part of the requested deliverable. Missing, pending, cancelled, failed, skipped, and neutral results are not passes; establish and disclose genuine path-based inapplicability. Never claim an unavailable required check passed.

## Report

Lead with actionable findings ordered by impact. Each finding needs a file and line, a concrete trigger or scenario, its consequence, and supporting evidence. Separate demonstrated defects from uncertainty and blocked verification. Say when no actionable findings remain; avoid restating the diff.

For an audit or requested score, give correctness confidence out of 100 grounded in inspected evidence and its limits. Explain which improvements would raise confidence. A score never authorizes merging or substitutes for required checks.

For readiness, summarize what was fixed, remaining findings and decisions, commands and outcomes, behavioral proof where applicable, and blockers. Claim readiness only when the applicable review and checks cover the current changes. Report limitations honestly when independent review or execution was unavailable. Do not post findings externally unless requested.
