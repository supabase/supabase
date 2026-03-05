---
name: studio-testing
description: Testing strategy for Supabase Studio. Use when writing tests, deciding what
  type of test to write, extracting logic from components into testable utility
  functions, or reviewing test coverage. Covers unit tests, component tests,
  and E2E test selection criteria.
---

# Studio Testing Strategy

How to write and structure tests for `apps/studio/`. The core principle: push
logic out of React components into pure utility functions, then test those
functions exhaustively. Only use component tests for complex UI interactions.
Use E2E tests for features shared between self-hosted and platform.

## When to Apply

Reference these guidelines when:

- Writing new tests for Studio code
- Deciding which type of test to write (unit, component, E2E)
- Extracting logic from a component to make it testable
- Reviewing whether test coverage is sufficient
- Adding a new feature that needs tests

## Rule Categories by Priority

| Priority | Category         | Impact   | Prefix     |
| -------- | ---------------- | -------- | ---------- |
| 1        | Logic Extraction | CRITICAL | `testing-` |
| 2        | Test Coverage    | CRITICAL | `testing-` |
| 3        | Component Tests  | HIGH     | `testing-` |
| 4        | E2E Tests        | HIGH     | `testing-` |

## Quick Reference

### 1. Logic Extraction (CRITICAL)

- `testing-extract-logic` - Remove logic from components into `.utils.ts` files
  as pure functions: args in, return out

### 2. Test Coverage (CRITICAL)

- `testing-exhaustive-permutations` - Test every permutation of utility functions:
  happy path, malformed input, empty values, edge cases

### 3. Component Tests (HIGH)

- `testing-component-tests-ui-only` - Only write component tests for complex UI
  interaction logic, not business logic

### 4. E2E Tests (HIGH)

- `testing-e2e-shared-features` - Write E2E tests for features used in both
  self-hosted and platform; cover clicks AND keyboard shortcuts

## Decision Tree: Which Test Type?

```
Is the logic a pure transformation (parse, format, validate, compute)?
  YES -> Extract to .utils.ts, write unit test with vitest
  NO  -> Does the feature involve complex UI interactions?
           YES -> Is it used in both self-hosted and platform?
                    YES -> Write E2E test in e2e/studio/features/
                    NO  -> Write component test with customRender
           NO  -> Can you extract the logic to make it pure?
                    YES -> Do that, then unit test it
                    NO  -> Write a component test
```

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/testing-extract-logic.md
rules/testing-exhaustive-permutations.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Real codebase references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## Codebase References

| What                    | Where                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Util test examples      | `tests/components/Grid/Grid.utils.test.ts`, `tests/components/Billing/TaxID.utils.test.ts`, `tests/components/Editor/SpreadsheetImport.utils.test.ts` |
| Component test examples | `tests/features/logs/LogsFilterPopover.test.tsx`, `tests/components/CopyButton.test.tsx`                                                              |
| E2E test example        | `e2e/studio/features/filter-bar.spec.ts`                                                                                                              |
| E2E helpers pattern     | `e2e/studio/utils/filter-bar-helpers.ts`                                                                                                              |
| Custom render           | `tests/lib/custom-render.tsx`                                                                                                                         |
| MSW mock setup          | `tests/lib/msw.ts` (`addAPIMock`)                                                                                                                     |
| Test README             | `tests/README.md`                                                                                                                                     |
| Vitest config           | `vitest.config.ts`                                                                                                                                    |
| Related skills          | `e2e-studio-tests` (running E2E), `vitest` (API reference), `vercel-composition-patterns` (component architecture)                                    |
