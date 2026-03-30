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

## 1. Extract Logic Into Utility Files (CRITICAL)

Remove as much logic from components as possible. Put it in co-located
`.utils.ts` files as pure functions: arguments in, return value out.

**File naming:**

- Utility: `ComponentName.utils.ts` next to the component
- Test: `tests/components/.../ComponentName.utils.test.ts` mirroring the source path

```tsx
// ❌ Logic buried in component — hard to test without rendering
function TaxIdForm({ taxIdValue, taxIdName }: Props) {
  const handleSubmit = () => {
    const taxId = TAX_IDS.find((t) => t.name === taxIdName)
    let sanitized = taxIdValue
    if (taxId?.vatPrefix && !taxIdValue.startsWith(taxId.vatPrefix)) {
      sanitized = taxId.vatPrefix + taxIdValue
    }
    submitToApi(sanitized)
  }
  return <form onSubmit={handleSubmit}>...</form>
}

// ✅ Logic extracted to .utils.ts — trivially testable
// TaxID.utils.ts
export function sanitizeTaxIdValue({ value, name }: { value: string; name: string }): string {
  const taxId = TAX_IDS.find((t) => t.name === name)
  if (taxId?.vatPrefix && !value.startsWith(taxId.vatPrefix)) {
    return taxId.vatPrefix + value
  }
  return value
}

// TaxIdForm.tsx — thin shell
const handleSubmit = () => {
  const sanitized = sanitizeTaxIdValue({ value: taxIdValue, name: taxIdName })
  submitToApi(sanitized)
}
```

## 2. Test Every Permutation (CRITICAL)

Once logic is extracted, test exhaustively. Every code path needs a test:

- Valid inputs (happy path for each branch)
- Invalid / malformed inputs
- Empty values, null values, missing fields
- Edge cases (timestamps with colons, special characters, boundary values)

```ts
// ❌ Only happy path
test('parses a filter', () => {
  expect(formatFilterURLParams('id:gte:20')).toStrictEqual({ column: 'id', operator: 'gte', value: '20' })
})

// ✅ Every permutation
test('parses valid filter', () => { ... })
test('handles timestamp with colons in value', () => { ... })
test('rejects malformed filter with missing parts', () => { ... })
test('rejects unrecognized operator', () => { ... })
test('allows empty filter value', () => { ... })
```

## 3. Component Tests for Complex UI Only (HIGH)

Only write component tests when there is complex UI interaction logic that
cannot be captured by testing utility functions alone.

**Valid reasons:** conditional rendering from user interaction sequences,
popover open/close with keyboard/mouse, multi-step form transitions.

**Not valid:** testing a calculation or transformation that happens to live
in a component — extract to `.utils.ts` and unit test instead.

```tsx
// Studio component test conventions
import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender } from 'tests/lib/custom-render' // always use customRender, not raw render
import { addAPIMock } from 'tests/lib/msw' // API mocking in beforeEach
```

## 4. E2E Tests for Shared Features (HIGH)

If a feature exists in both self-hosted and platform, create an E2E test.
Cover mouse clicks AND keyboard shortcuts (Tab, Enter, Escape, Arrow keys).

Extract reusable interactions into `e2e/studio/utils/*-helpers.ts`. Use
try/finally for resource cleanup. For E2E execution details, see the
`studio-e2e-tests` skill.

## Codebase References

| What                    | Where                                                                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Util test examples      | `apps/studio/tests/components/Grid/Grid.utils.test.ts`, `apps/studio/tests/components/Billing/TaxID.utils.test.ts`, `apps/studio/tests/components/Editor/SpreadsheetImport.utils.test.ts` |
| Component test examples | `apps/studio/tests/features/logs/LogsFilterPopover.test.tsx`, `apps/studio/tests/components/CopyButton.test.tsx`                                                                                      |
| E2E test example        | `e2e/studio/features/filter-bar.spec.ts`                                                                                                                                                              |
| E2E helpers pattern     | `e2e/studio/utils/filter-bar-helpers.ts`                                                                                                                                                              |
| Custom render           | `apps/studio/tests/lib/custom-render.tsx`                                                                                                                                                             |
| MSW mock setup          | `apps/studio/tests/lib/msw.ts` (`addAPIMock`)                                                                                                                                                         |
| Test README             | `apps/studio/tests/README.md`                                                                                                                                                                         |
| Vitest config           | `apps/studio/vitest.config.ts`                                                                                                                                                                        |
| Related skills          | `studio-e2e-tests` (running E2E), `vitest` (API reference), `vercel-composition-patterns` (component architecture)                                    |
