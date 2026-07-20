import { describe, expect, it } from 'vitest'

import { calculateRestartCostEstimate } from './RestartCostEstimate'

const tables = [
  {
    schema: 'public',
    name: 'orders',
    estimated_bytes: 2_000_000_000,
    estimated_cost: 1.25,
    is_row_filtered: false,
  },
  {
    schema: 'public',
    name: 'customers',
    estimated_bytes: 1_000_000_000,
    estimated_cost: 0.75,
    is_row_filtered: true,
  },
  {
    schema: 'internal',
    name: 'audit_log',
    estimated_bytes: 500_000_000,
    estimated_cost: 0.3,
    is_row_filtered: false,
  },
]

describe('calculateRestartCostEstimate', () => {
  it('sums only the tables being restarted', () => {
    expect(calculateRestartCostEstimate(tables, ['public.orders', 'public.customers'])).toEqual({
      isComplete: true,
      estimatedBytes: 3_000_000_000,
      estimatedCost: 2,
      hasRowFilteredTables: true,
    })
  })

  it('marks the estimate incomplete when a restarted table is missing', () => {
    expect(
      calculateRestartCostEstimate(tables, ['public.orders', 'public.missing']).isComplete
    ).toBe(false)
  })
})
