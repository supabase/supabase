import { describe, expect, it } from 'vitest'

import { isTracingAllowed } from './braintrust-logger'

const baseAllowed = {
  orgHasHipaaAddon: false,
  projectIsSensitive: false,
  orgIsDpaSigned: false,
  projectRegion: 'us-east-1',
}

describe('isTracingAllowed', () => {
  it('allows tracing when all flags are explicitly off/non-EU', () => {
    expect(isTracingAllowed(baseAllowed)).toBe(true)
  })

  it('disallows tracing when HIPAA addon is active and project is sensitive', () => {
    expect(
      isTracingAllowed({ ...baseAllowed, orgHasHipaaAddon: true, projectIsSensitive: true })
    ).toBe(false)
  })

  it('allows tracing when HIPAA addon is active but project is not sensitive', () => {
    expect(
      isTracingAllowed({ ...baseAllowed, orgHasHipaaAddon: true, projectIsSensitive: false })
    ).toBe(true)
  })

  it('allows tracing when project is sensitive but no HIPAA addon', () => {
    expect(
      isTracingAllowed({ ...baseAllowed, orgHasHipaaAddon: false, projectIsSensitive: true })
    ).toBe(true)
  })

  it('disallows tracing when DPA is signed', () => {
    expect(isTracingAllowed({ ...baseAllowed, orgIsDpaSigned: true })).toBe(false)
  })

  it('disallows tracing for EU regions', () => {
    expect(isTracingAllowed({ ...baseAllowed, projectRegion: 'eu-west-1' })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, projectRegion: 'eu-central-1' })).toBe(false)
  })

  it('allows tracing for non-EU regions', () => {
    expect(isTracingAllowed({ ...baseAllowed, projectRegion: 'ap-southeast-1' })).toBe(true)
  })

  it('allows tracing when HIPAA addon is false and is_sensitive is null (DB default)', () => {
    expect(isTracingAllowed({ ...baseAllowed, projectIsSensitive: null })).toBe(true)
  })

  it('disallows tracing when HIPAA addon is unknown and is_sensitive is null', () => {
    expect(
      isTracingAllowed({ ...baseAllowed, orgHasHipaaAddon: undefined, projectIsSensitive: null })
    ).toBe(false)
  })

  it('disallows tracing when flags are undefined (unknown = restricted)', () => {
    expect(
      isTracingAllowed({
        orgHasHipaaAddon: undefined,
        projectIsSensitive: undefined,
        orgIsDpaSigned: undefined,
        projectRegion: undefined,
      })
    ).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, orgIsDpaSigned: undefined })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, projectRegion: undefined })).toBe(false)
    expect(isTracingAllowed({ ...baseAllowed, orgHasHipaaAddon: undefined })).toBe(false)
    // projectIsSensitive unknown only matters when orgHasHipaaAddon is also unknown
    expect(
      isTracingAllowed({
        ...baseAllowed,
        orgHasHipaaAddon: undefined,
        projectIsSensitive: undefined,
      })
    ).toBe(false)
  })
})
