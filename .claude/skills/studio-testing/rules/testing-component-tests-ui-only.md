---
title: Component Tests Are for Complex UI Logic Only
impact: HIGH
impactDescription: prevents slow, brittle tests that should be unit tests
tags: testing, components, ui, react
---

## Component Tests Are for Complex UI Logic Only

Only write component tests (`.test.tsx`) when there is complex UI interaction
logic that cannot be captured by testing utility functions alone.

**Valid reasons for a component test:**

- Conditional rendering based on user interaction sequences
- Popover/dropdown open/close behavior with keyboard and mouse
- Form state transitions across multiple steps
- Components that coordinate multiple async operations visually

**Not a valid reason:** testing a calculation, transformation, parsing, or
validation that happens to live inside a component. Extract that logic into a
`.utils.ts` file and unit test it instead.

**Incorrect (rendering a component just to test logic):**

```tsx
test('formats the display value correctly', () => {
  render(<PriceDisplay amount={1234} currency="USD" />)
  expect(screen.getByText('$12.34')).toBeInTheDocument()
})
```

This is really testing a formatting function. Extract it:

```ts
// PriceDisplay.utils.ts
export function formatPrice(amount: number, currency: string): string { ... }

// PriceDisplay.utils.test.ts
test('formats USD cents to dollars', () => {
  expect(formatPrice(1234, 'USD')).toBe('$12.34')
})
```

**Correct (component test for real UI interaction logic):**

```tsx
// Testing popover open/close, filter application, keyboard dismiss
describe('LogsFilterPopover', () => {
  test('opens popover and shows filter options', async () => {
    customRender(<LogsFilterPopover onFiltersChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Apply')).toBeVisible()
  })

  test('applies selected filters on submit', async () => {
    const onChange = vi.fn()
    customRender(<LogsFilterPopover onFiltersChange={onChange} />)
    // ... interact with UI ...
    await userEvent.click(screen.getByText('Apply'))
    expect(onChange).toHaveBeenCalledWith(expectedFilters)
  })

  test('closes on Escape key', async () => {
    customRender(<LogsFilterPopover onFiltersChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button'))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByText('Apply')).not.toBeInTheDocument()
  })
})
```

**Studio component test conventions:**

```tsx
// Always use customRender, not raw render
import { fireEvent } from '@testing-library/react'
// Use userEvent for popovers, fireEvent for dropdowns
import userEvent from '@testing-library/user-event'
import { customRender } from 'tests/lib/custom-render'
// Use addAPIMock for API mocking in beforeEach
import { addAPIMock } from 'tests/lib/msw'
```

See `tests/README.md` for full conventions on custom render, MSW mocking,
and nuqs URL parameter testing.
