---
name: studio-testing
description: Testing strategy for Supabase Studio. Use when selecting, writing,
  or reviewing tests, or extracting logic for testing. Covers meaningful unit,
  component, and E2E coverage and scoped verification.
---

# Studio Testing Strategy

Protect meaningful observable behavior and plausible regressions. Choose the
fastest test that catches the failure; do not chase coverage percentages or
exhaustive input permutations.

## Choose coverage by behavior

Before adding a test, identify what would get worse for a user or caller if the
behavior broke. Read nearby tests first so new coverage fills a real gap.

| Layer           | Use for                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Static analysis | Types, invalid imports, and other guarantees the compiler or linter already checks                             |
| Unit tests      | Pure calculations, parsing, validation, permissions, and data transformations                                  |
| Component tests | Rendered behavior and consequential interactions, including simple forms that submit, mutate data, or navigate |
| E2E tests       | Critical user journeys and integration or environment differences that lower layers cannot establish           |

Extract pure logic into a co-located `.utils.ts` when that clarifies the component
and gives the logic a useful independent contract. Do not extract solely to avoid
testing the component's wiring. Utility tests commonly live under
`apps/studio/tests/components/.../ComponentName.utils.test.ts`, mirroring the
source path; follow nearby conventions for co-located tests.

Cover expected usage, realistic failures, relevant boundaries, and known
regressions. For a bug fix, reproduce the failure before fixing it. Respect
backend and API guarantees rather than inventing unsupported inputs. A change
to prose, a constant, a re-export, pure markup, or a guarantee already established
by static analysis does not need a new test merely because a file changed.

## Assert observable outcomes

Test what the end user sees and does, or the public contract a caller consumes.
Prefer roles and labels to test IDs. Check visible text, disabled state,
navigation, public callbacks, or a meaningful request contract.

Do not assert on internal state, refs, private methods, child-component render
spies, hook calls inside components, CSS classes, DOM structure, or whole-tree
snapshots as proxies for behavior. A behavior-preserving refactor should not
require changing assertions. Pure utility input/output tests remain valid when
they protect a public contract.

Reuse production definitions, representative inputs, and existing test factories
before copying configuration or API fixtures. Keep expected outcomes independent:
do not calculate an expected result with the same helper being tested. Small
explicit inputs are useful when they make a calculation or boundary clear.

Remove redundant cases when they catch the same failure. Use `test.each` for
distinct scenarios sharing a setup, not to multiply equivalent literals.
Preserve distinct boundary, permission, security, error, and historical-data
coverage. If a brittle assertion is the only protection for a meaningful
regression, replace it with an observable assertion before removing it.

## Component and E2E integration

Use `customRender` from `@/tests/lib/custom-render` for Studio providers. Mock
API requests at the network boundary with `addAPIMock`, keeping real query and
mutation behavior. Pass the OpenAPI body type to `HttpResponse.json<…>`:

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

Follow [studio-mock-api-tests](../studio-mock-api-tests/SKILL.md) for the full
MSW template, faithful boundary replacements, and harness requirements. Do not
add module mocks for queries, children, or shared hooks to bypass integration.

A feature being shared by self-hosted and platform does not alone justify E2E
coverage. Use E2E for critical journeys or behavior that differs across those
environments and cannot be established in a focused test. Cover mouse and
keyboard behavior where each protects the journey. Reuse interactions in
`e2e/studio/utils/*-helpers.ts`, and clean up resources in `finally`. Follow
[studio-e2e-tests](../studio-e2e-tests/SKILL.md) for execution.

## Keep tests fast

Choose the appropriate environment and avoid unnecessary work in interactions.

### Put pure logic in `.test.ts` so it runs in node

`vitest.config.ts` runs `**/*.test.ts` in the `node` environment and
`**/*.test.tsx` in `jsdom`. jsdom costs ~1s of setup per file, so:

- Utility, schema, and resolver tests: name the file `.test.ts` and don't
  import anything from Testing Library.
- Tests that need the DOM, including `renderHook` and `window.localStorage`:
  use `.test.tsx` rather than adding an environment directive.
- `.platform.test.tsx` files run with `NEXT_PUBLIC_IS_PLATFORM=true`.

DOM setup files (`tests/setup/dom.ts`, `tests/setup/radix.js`) no-op in node.

### Never wait on real time

Don't sleep (`setTimeout(resolve, …)`), raise `findBy*` timeouts to wait out
a poll interval, or bump per-test timeouts. Use fake timers and advance
them. `shouldAdvanceTime: true` keeps `waitFor` polling, MSW, and router
microtasks working:

```tsx
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
instead of a 650ms sleep. Reuse the existing interval/debounce constant rather than duplicating its value.

### Paste, don't type

`user.type` fires keydown/keypress/input/keyup per character, and each one
can re-render a whole form. Unless keystroke-level behavior is what you're
testing (input masks, shortcuts, per-key validation), set the value in one go:

```tsx
await user.click(input)
await user.paste('my-project')
```

A single `fireEvent.change` is also suitable when keyboard behavior is irrelevant.
When using `userEvent` with fake timers, configure its `advanceTimers` option.

### Scope `*ByRole` queries

`*ByRole` checks accessibility (including `getComputedStyle`) for every
candidate element. Radix `Select` renders a hidden native `<option>` for
each item, so an unscoped `findByRole('option')` on a large form checks
hundreds of elements. Scope it to the open listbox:

```tsx
const findOption = async (name: string | RegExp) =>
  within(await screen.findByRole('listbox')).findByRole('option', { name })

await user.click(await findOption('East US'))
```

## Verify the affected behavior

1. Run relevant existing unit and integration tests with retries disabled, even
   when no new tests are needed for the executable change. Record the command
   and result. An environment or dependency failure is a blocker, not a pass.
2. When investigating order dependence or flakiness, repeat affected tests and
   shuffle where supported, with retries disabled. Record reproducible seeds.
   Fix shared state, timing, ordering, or cleanup rather than masking failures
   with retries, longer timeouts, or skips.
3. For new or changed assertions and regression-critical coverage, temporarily
   introduce a realistic scoped production fault, such as omitting a side effect
   or removing a guard. Confirm the relevant assertion fails for that behavior;
   import errors, compile errors, timeouts, and infrastructure failures do not
   count. Save the original bytes first and restore them in `finally` or an
   equivalent guaranteed cleanup, preserving unrelated edits. Rerun the restored
   code and check that no mutation remains.
4. Check formatting and relevant types separately; passing Vitest does not prove
   TypeScript correctness. Report checks actually run and any blocked evidence.

Use focused existing tooling; do not add automated test machinery or mutation
probes for prose or static guarantees. For read-only reviews, report missing
verification evidence without changing source or introducing mutations.

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
