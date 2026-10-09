import { describe, expect, it } from 'vitest'

import { resolveRealtimeUnavailable } from '../useHighAvailability'

describe('resolveRealtimeUnavailable', () => {
  it('is unavailable on High Availability projects outside staging and local', () => {
    expect(resolveRealtimeUnavailable(true, false)).toBe(true)
  })

  it('is available on High Availability projects in staging and local', () => {
    expect(resolveRealtimeUnavailable(true, true)).toBe(false)
  })

  it('is available on standard projects in every environment', () => {
    expect(resolveRealtimeUnavailable(false, false)).toBe(false)
    expect(resolveRealtimeUnavailable(false, true)).toBe(false)
  })
})
