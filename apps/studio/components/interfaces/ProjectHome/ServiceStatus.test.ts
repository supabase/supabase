import { describe, expect, it } from 'vitest'

import { resolveRealtimeServiceStatus } from './ServiceStatus.utils'

describe('resolveRealtimeServiceStatus', () => {
  it('marks Realtime as disabled on High Availability projects', () => {
    expect(resolveRealtimeServiceStatus(true, 'UNHEALTHY')).toBe('DISABLED')
  })

  it('preserves Realtime health on standard projects', () => {
    expect(resolveRealtimeServiceStatus(false, 'ACTIVE_HEALTHY')).toBe('ACTIVE_HEALTHY')
    expect(resolveRealtimeServiceStatus(false, 'UNHEALTHY')).toBe('UNHEALTHY')
  })
})
