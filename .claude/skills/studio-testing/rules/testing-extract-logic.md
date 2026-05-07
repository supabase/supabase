---
title: Extract Logic Into Utility Files
impact: CRITICAL
impactDescription: makes business logic trivially testable without rendering components
tags: testing, utils, extraction, pure-functions
---

## Extract Logic Into Utility Files

Remove as much logic from components as possible. Put it in co-located
`.utils.ts` files as pure functions: arguments in, return value out. No React
hooks, no context, no side effects.

**File naming convention:**

- Utility file: `ComponentName.utils.ts` next to the component
- Test file: `tests/components/.../ComponentName.utils.test.ts` mirroring the source path
- Or under `tests/unit/` for non-component utilities

**Incorrect (logic buried inside a component):**

```tsx
// components/Billing/TaxIdForm.tsx
function TaxIdForm({ taxIdValue, taxIdName }: Props) {
  const handleSubmit = () => {
    // Logic buried in the component -- hard to test without rendering
    const taxId = TAX_IDS.find((t) => t.name === taxIdName)
    let sanitized = taxIdValue
    if (taxId?.vatPrefix && !taxIdValue.startsWith(taxId.vatPrefix)) {
      sanitized = taxId.vatPrefix + taxIdValue
    }
    submitToApi(sanitized)
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Correct (logic extracted to a utility file):**

```ts
// components/Billing/TaxID.utils.ts
import { TAX_IDS } from './TaxID.constants'

// Pure function: args in, return out
export function sanitizeTaxIdValue({ value, name }: { value: string; name: string }): string {
  const taxId = TAX_IDS.find((t) => t.name === name)
  if (taxId?.vatPrefix && !value.startsWith(taxId.vatPrefix)) {
    return taxId.vatPrefix + value
  }
  return value
}
```

```tsx
// components/Billing/TaxIdForm.tsx
import { sanitizeTaxIdValue } from './TaxID.utils'

function TaxIdForm({ taxIdValue, taxIdName }: Props) {
  const handleSubmit = () => {
    const sanitized = sanitizeTaxIdValue({ value: taxIdValue, name: taxIdName })
    submitToApi(sanitized)
  }
  return <form onSubmit={handleSubmit}>...</form>
}
```

```ts
// tests/components/Billing/TaxID.utils.test.ts
import { sanitizeTaxIdValue } from 'components/.../TaxID.utils'

describe('sanitizeTaxIdValue', () => {
  test('prefixes unprefixed EU tax ID', () => {
    expect(sanitizeTaxIdValue({ value: '12345678', name: 'AT VAT' })).toBe('ATU12345678')
  })

  test('passes through already-prefixed EU tax ID', () => {
    expect(sanitizeTaxIdValue({ value: 'ATU12345678', name: 'AT VAT' })).toBe('ATU12345678')
  })

  test('passes through non-EU tax ID unchanged', () => {
    expect(sanitizeTaxIdValue({ value: '12-3456789', name: 'US EIN' })).toBe('12-3456789')
  })
})
```

The component becomes a thin shell that calls the utility. All business logic
is testable without rendering anything.

**Real codebase examples:**

- `components/grid/SupabaseGrid.utils.ts` -- URL param parsing, used by 15+ components
- `components/.../SpreadsheetImport/SpreadsheetImport.utils.tsx` -- CSV parsing, column type inference
- `components/.../BillingCustomerData/TaxID.utils.ts` -- tax ID sanitization and comparison
