import { describe, expect, it } from 'vitest'

import { resolveRealtimeServiceStatus } from './ServiceStatus.utils'

describe('resolveRealtimeServiceStatus', () => {
  it('marks Realtime as disabled when it is unavailable', () => {
    expect(resolveRealtimeServiceStatus(true, 'UNHEALTHY')).toBe('DISABLED')
  })

  it('preserves Realtime health when it is available', () => {
    expect(resolveRealtimeServiceStatus(false, 'ACTIVE_HEALTHY')).toBe('ACTIVE_HEALTHY')
    expect(resolveRealtimeServiceStatus(false, 'UNHEALTHY')).toBe('UNHEALTHY')
  })
})
