import { describe, expect, it } from 'vitest'

import { normalizeLogDrainsData } from './log-drains-query'

describe('normalizeLogDrainsData', () => {
  it('returns array as-is for valid payloads', () => {
    const payload = [{ id: 1, name: 'drain-a' }, { id: 2, name: 'drain-b' }]
    expect(normalizeLogDrainsData(payload)).toEqual(payload)
  })

  it('returns empty array for non-array payloads', () => {
    expect(normalizeLogDrainsData(undefined)).toEqual([])
    expect(normalizeLogDrainsData(null)).toEqual([])
    expect(normalizeLogDrainsData({ error: { message: 'no table' } })).toEqual([])
    expect(normalizeLogDrainsData('invalid')).toEqual([])
  })
})
