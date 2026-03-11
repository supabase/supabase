---
title: Test Every Permutation of Utility Functions
impact: CRITICAL
impactDescription: catches edge cases and regressions in business logic
tags: testing, utils, coverage, permutations
---

## Test Every Permutation of Utility Functions

Once logic is extracted into a pure function, test it exhaustively. Every code
path should have a test. Don't just test the happy path.

**What to cover:**

- Valid inputs (happy path for each branch)
- Invalid / malformed inputs
- Empty values, null values, missing fields
- Edge cases (timestamps with colons, special characters, boundary values)
- Security-sensitive inputs (XSS payloads, external URLs) where relevant

**Incorrect (only tests the happy path):**

```ts
describe('formatFilterURLParams', () => {
  test('parses a filter', () => {
    const result = formatFilterURLParams('id:gte:20')
    expect(result).toStrictEqual({ column: 'id', operator: 'gte', value: '20' })
  })
})
```

**Correct (tests every permutation):**

```ts
describe('formatFilterURLParams', () => {
  test('parses valid filter', () => {
    const result = formatFilterURLParams('id:gte:20')
    expect(result).toStrictEqual({ column: 'id', operator: 'gte', value: '20' })
  })

  test('handles timestamp with colons in value', () => {
    const result = formatFilterURLParams('created:gte:2024-01-01T00:00:00')
    expect(result).toStrictEqual({
      column: 'created',
      operator: 'gte',
      value: '2024-01-01T00:00:00',
    })
  })

  test('rejects malformed filter with missing parts', () => {
    const result = formatFilterURLParams('id')
    expect(result).toBeUndefined()
  })

  test('rejects unrecognized operator', () => {
    const result = formatFilterURLParams('id:nope:20')
    expect(result).toBeUndefined()
  })

  test('allows empty filter value', () => {
    const result = formatFilterURLParams('name:eq:')
    expect(result).toStrictEqual({ column: 'name', operator: 'eq', value: '' })
  })
})
```

**Another real example -- `inferColumnType` tests every data type:**

```ts
describe('inferColumnType', () => {
  test('defaults to text for empty data', () => { ... })
  test('defaults to text for missing column', () => { ... })
  test('defaults to text for null values', () => { ... })
  test('detects integer', () => { ... })       // "42" -> int8
  test('detects float', () => { ... })          // "161.72" -> float8
  test('detects boolean', () => { ... })        // "true"/"false" -> bool
  test('detects boolean with nulls', () => { ... })
  test('detects JSON object', () => { ... })    // "{}" -> jsonb
  test('detects timestamp', () => { ... })      // multiple formats -> timestamptz
})
```

The goal: if someone changes the function, at least one test should break for
any behavioral change.
