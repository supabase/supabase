import { describe, expect, it } from 'vitest'

import { isTracingAllowed } from './braintrust-logger'

describe('isTracingAllowed', () => {
  it('allows tracing for non-EU regions', () => {
    expect(isTracingAllowed({ projectRegion: 'us-east-1' })).toBe(true)
    expect(isTracingAllowed({ projectRegion: 'ap-southeast-1' })).toBe(true)
  })

  it('disallows tracing for EU regions', () => {
    expect(isTracingAllowed({ projectRegion: 'eu-west-1' })).toBe(false)
    expect(isTracingAllowed({ projectRegion: 'eu-central-1' })).toBe(false)
  })

  it('disallows tracing when the region is unknown', () => {
    expect(isTracingAllowed({ projectRegion: undefined })).toBe(false)
  })
})
