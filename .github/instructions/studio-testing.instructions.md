---
applyTo: "apps/studio/**"
---

# Studio Testing Review Rules

All comments are **advisory**.

## Core Principle

Push logic out of React components into pure `.utils.ts` functions, then test those functions exhaustively. Only use component tests for complex UI interactions.

## When to Comment

- PR adds **business logic inline in a component** that could be extracted to a `ComponentName.utils.ts` file next to the component and unit tested at `tests/components/.../ComponentName.utils.test.ts`
- PR adds a **utility function without test coverage**
- PR uses **component tests for pure logic** that should be a unit test on a pure function
- PR adds a **feature used in both self-hosted and platform** without E2E test consideration

## Which Test Type to Suggest

- **Pure transformation** (parse, format, validate, compute) → extract to `.utils.ts` + unit test with vitest
- **Complex UI interaction** → component test with `customRender` (or E2E if shared with self-hosted)
- **E2E tests** should cover both click interactions AND keyboard shortcuts
- **No tests at all** for non-trivial changes → nudge to add coverage

## Reference

See `.claude/skills/studio-testing/SKILL.md` for the full testing standard.
