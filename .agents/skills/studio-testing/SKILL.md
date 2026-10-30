---
name: studio-testing
description: Testing strategy for Supabase Studio. Use when writing tests, deciding
  whether a change needs tests and which type, extracting logic from components into
  testable utility functions, or reviewing test coverage. Covers unit tests, component
  tests, and E2E test selection criteria.
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
| 5        | Test Speed       | HIGH     | `testing-` |

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

### 5. Test Speed (HIGH)

- `testing-node-environment` - Pure-logic tests go in `.test.ts` (runs in node);
  only `.test.tsx` gets jsdom
- `testing-fake-timers` - Never wait on real time; advance fake timers past
  debounces and poll intervals
- `testing-paste-not-type` - Set input values with `user.paste` or
  `fireEvent.change` unless keystroke behavior is under test
- `testing-scope-queries` - Scope `*ByRole` option queries to the open listbox
- `testing-no-redundant-tests` - Merge near-duplicates into `test.each`; delete
  tests that can't fail or only cover libraries, class names, or snapshots

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

When several cases share the same arrange/act/assert shape, write one
`test.each` table instead of copy-pasted tests. Each row is a permutation;
the table makes gaps easy to spot. See section 5 for what not to test.

## 3. Component Tests for Complex UI Only (HIGH)

Only write component tests when there is complex UI interaction logic that
cannot be captured by testing utility functions alone.

**Valid reasons:** conditional rendering from user interaction sequences,
popover open/close with keyboard/mouse, multi-step form transitions.

**Not valid:** testing a calculation or transformation that happens to live
in a component — extract to `.utils.ts` and unit test instead.

Studio component test conventions:

```tsx
import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'

import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']

addAPIMock({
  method: 'get',
  path: '/platform/organizations',
  response: () => HttpResponse.json<OrganizationResponse[]>([]),
})
customRender(<MyComponent />)
expect(await screen.findByText('No organizations')).toBeInTheDocument()
```

- Mock API requests at the network layer with `addAPIMock` (MSW) — unhandled requests fail the test. Don't `vi.mock('@/data/...')`. Always pass the OpenAPI body type to `HttpResponse.json<…>`.
- `customRender` wraps the component in the providers Studio needs (React Query, router, etc.).
- The full template, path-param syntax, and the jsdom/MSW gotchas are in the `studio-mock-api-tests` skill.

## 4. E2E Tests for Shared Features (HIGH)

If a feature exists in both self-hosted and platform, create an E2E test.
Cover mouse clicks AND keyboard shortcuts (Tab, Enter, Escape, Arrow keys).

Extract reusable interactions into `e2e/studio/utils/*-helpers.ts`. Use
try/finally for resource cleanup. For E2E execution details, see the
`studio-e2e-tests` skill.

## 5. Keep Tests Fast (HIGH)

Studio has thousands of unit tests, and a few seconds per file adds up to
minutes on every PR. These patterns took CI from ~14 minutes to ~9 before
sharding. Apply them to every new test.

### Put pure logic in `.test.ts` so it runs in node

`vitest.config.ts` runs `**/*.test.ts` in the `node` environment and
`**/*.test.tsx` in `jsdom`. jsdom costs ~1s of setup per file, so:

- Utility, schema, and resolver tests: name the file `.test.ts` and don't
  import anything from Testing Library.
- A `.test.ts` file that genuinely needs the DOM (e.g. `renderHook`,
  `window.localStorage`) opts in with a docblock as the **first line**:

```ts
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
```

Don't rename a pure-logic test to `.tsx` or add the docblock "just in case".
DOM setup files (`tests/setup/dom.ts`, `tests/setup/radix.js`) no-op in node.

### Never wait on real time

Don't sleep (`setTimeout(resolve, …)`), raise `findBy*` timeouts to wait out
a poll interval, or bump per-test timeouts. Use fake timers and advance
them. `shouldAdvanceTime: true` keeps `waitFor` polling, MSW, and router
microtasks working:

```tsx
// ❌ Waits 4s+ of real time per poll (this file took 18s)
expect(
  await screen.findByText('Restoration complete!', {}, { timeout: POLL_INTERVAL_MS + 2000 })
).toBeInTheDocument()

// ✅ Advance past the poll instead (same file now takes 0.3s)
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  vi.useRealTimers()
})

const advancePoll = () => act(() => vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS))

await advancePoll()
expect(await screen.findByText('Restoration complete!')).toBeInTheDocument()
```

The same applies to debounces: `act(() => vi.advanceTimersByTimeAsync(650))`
instead of a 650ms sleep. Export the interval/debounce constant from the
source so the test doesn't hard-code it.

### Paste, don't type

`user.type` fires keydown/keypress/input/keyup per character, and each one
can re-render a whole form. Unless keystroke-level behavior is what you're
testing (input masks, shortcuts, per-key validation), set the value in one go:

```tsx
// ❌ One re-render per character
await user.type(screen.getByPlaceholderText('Project name'), 'my-project')

// ✅ Focus then paste
await user.click(input)
await user.paste('my-project')

// ✅ Or a single change event
fireEvent.change(input, { target: { value: 'my-project' } })
```

If you do need `userEvent`, create it with `userEvent.setup({ delay: null })`
to drop the per-action delay.

### Scope `*ByRole` queries

`*ByRole` checks accessibility (including `getComputedStyle`) for every
candidate element. Radix `Select` renders a hidden native `<option>` for
each item, so an unscoped `findByRole('option')` on a large form checks
hundreds of elements. Scope it to the open listbox:

```tsx
// ❌ Scans every hidden <option> on the page
await user.click(await screen.findByRole('option', { name: 'East US' }))

// ✅ Only the open listbox
const findOption = async (name: string | RegExp) =>
  within(await screen.findByRole('listbox')).findByRole('option', { name })

await user.click(await findOption('East US'))
```

For very large pages, `configure({ defaultHidden: true })` skips the
per-element visibility check and makes each `*ByRole` query about 3x
cheaper. Only use it when your assertions don't depend on visibility.

### Don't write redundant tests

Every test costs CI time. Don't add tests that:

- Duplicate another test with different literals. Add a `test.each` row instead.
- Exercise a library rather than our code (e.g. that zod rejects a wrong type,
  that dayjs formats a date).
- Assert on class names or snapshots. They break on styling changes and don't
  catch behavior bugs.
- Exist only for coverage numbers.

Make sure every test can fail. Common ways a test passes no matter what:

- Unawaited async assertions (`expect(promise).resolves…` or `waitFor(…)`
  without `await`).
- A fixture equal to the default value, so the "changed" path is never hit.
- Calling the wrong function (e.g. a `semverGte` test that calls `semverLte`).

Quick check: break the code under test and confirm the test goes red.

## Codebase References

| What                    | Where                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Util test examples      | `apps/studio/tests/components/Grid/Grid.utils.test.ts`, `apps/studio/tests/components/Billing/TaxID.utils.test.ts`, `apps/studio/tests/components/Editor/SpreadsheetImport.utils.test.ts` |
| Component test examples | `apps/studio/tests/features/logs/LogsFilterPopover.test.tsx`, `apps/studio/tests/components/CopyButton.test.tsx`                                                                          |
| Fake timers (polling)   | `apps/studio/components/layouts/ProjectLayout/RestoringState.test.tsx`                                                                                                                    |
| Fake timers (debounce)  | `apps/studio/hooks/misc/__tests__/useTableEditorFiltersSort.navigation.test.tsx`                                                                                                          |
| Scoped listbox queries  | `apps/studio/tests/pages/new/[slug].test.tsx`, `apps/studio/components/interfaces/Account/AccessTokens/Scoped/Form/ResourceAccessStep.test.tsx`                                           |
| E2E test example        | `e2e/studio/features/filter-bar.spec.ts`                                                                                                                                                  |
| E2E helpers pattern     | `e2e/studio/utils/filter-bar-helpers.ts`                                                                                                                                                  |
| Custom render           | `apps/studio/tests/lib/custom-render.tsx`                                                                                                                                                 |
| MSW mock setup          | `apps/studio/tests/lib/msw.ts` (`addAPIMock`)                                                                                                                                             |
| Test README             | `apps/studio/tests/README.md`                                                                                                                                                             |
| Vitest config           | `apps/studio/vitest.config.ts`                                                                                                                                                            |
| Related skills          | `studio-e2e-tests` (running E2E), `vitest` (API reference), `vercel-composition-patterns` (component architecture)                                                                        |
