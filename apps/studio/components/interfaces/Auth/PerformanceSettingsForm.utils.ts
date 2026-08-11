export type AllocationUnit = 'percent' | 'connections'

export function isAllocationUnit(value: unknown): value is AllocationUnit {
  return value === 'percent' || value === 'connections'
}

// Converts a pool size between units when the allocation strategy changes,
// preserving roughly the same effective connection budget.
export function convertPoolSize({
  fromUnit,
  toUnit,
  currentValue,
  maxConnectionLimit,
}: {
  fromUnit: AllocationUnit
  toUnit: AllocationUnit
  currentValue: number
  maxConnectionLimit: number
}): number {
  if (fromUnit === toUnit) return currentValue

  if (toUnit === 'percent') {
    return Math.ceil((Math.min(maxConnectionLimit, currentValue) / maxConnectionLimit) * 100)
  }

  return Math.floor(maxConnectionLimit * (Math.min(100, currentValue) / 100))
}
