import { describe, expect, it } from 'vitest'

import { isTracingAllowed } from './braintrust-logger'

const baseAllowed = {
  hasHipaaAddon: false,
  isSensitive: false,
  isDpaSigned: false,
  region: 'us-east-1',
}

describe('isTracingAllowed', () => {
  it('allows tracing when all flags are explicitly off/non-EU', () => {
    expect(isTracingAllowed(baseAllowed)).toBe(true)
  })

  it('disallows tracing when HIPAA addon is active and project is sensitive', () => {
    expect(isTracingAllowed({ ...baseAllowed, hasHipaaAddon: true, isSensitive: true })).toBe(false)
  })

  it('allows tracing when HIPAA addon is active but project is not sensitive', () => {
    expect(isTracingAllowed({ ...baseAllowed, hasHipaaAddon: true, isSensitive: false })).toBe(true)
  })

  it('allows tracing when project is sensitive but no HIPAA addon', () => {
    expect(isTracingAllowed({ ...baseAllowed, hasHipaaAddon: false, isSensitive: true })).toBe(true)
  })

  it('disallows tracing when DPA is signed', () => {
    expect(isTracingAllowed({ ...baseAllowed, isDpaSigned: true })).toBe(false)
  })

  it('disallows tracing for EU regions', () => {
    expect(isTracingAllowed({ ...baseAllowed, region: 'eu-west-1' })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, region: 'eu-central-1' })).toBe(false)
  })

  it('allows tracing for non-EU regions', () => {
    expect(isTracingAllowed({ ...baseAllowed, region: 'ap-southeast-1' })).toBe(true)
  })

  it('disallows tracing when flags are undefined (unknown = restricted)', () => {
    expect(
      isTracingAllowed({
        hasHipaaAddon: undefined,
        isSensitive: undefined,
        isDpaSigned: undefined,
        region: undefined,
      })
    ).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, isDpaSigned: undefined })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, region: undefined })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, hasHipaaAddon: undefined })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, isSensitive: undefined })).toBe(false)
  })
})
