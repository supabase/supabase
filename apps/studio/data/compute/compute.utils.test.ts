import { describe, expect, it } from 'vitest'

import { parseComputeInstance } from './compute.utils'

const datum = (attributes: Record<string, unknown>) => ({
  id: 'embed',
  type: 'project_worker',
  attributes: {
    build_state: 'active',
    secret_generation: '1',
    spec: { exposure: 'private', instances: 1, size: '2gb-1vcpu' },
    ...attributes,
  },
})

describe('parseComputeInstance', () => {
  it('maps the API response onto the view model', () => {
    expect(
      parseComputeInstance(
        datum({
          spec: { exposure: 'public', instances: 3, runtime: 'node', size: '4gb-2vcpu' },
          instances: { declared: 3, live: 3, ready: 2, stale: 0 },
          image_version: '1.0',
        })
      )
    ).toEqual({
      name: 'embed',
      buildState: 'active',
      isDeleting: false,
      runtime: 'node',
      size: '4gb-2vcpu',
      access: 'public',
      declaredInstances: 3,
      instances: { declared: 3, live: 3, ready: 2, stale: 0 },
      imageVersion: '1.0',
      stateReason: undefined,
      instancesError: undefined,
    })
  })

  it('treats any exposure other than public as private', () => {
    expect(
      parseComputeInstance(
        datum({ spec: { exposure: 'internal', instances: 1, size: '2gb-1vcpu' } })
      )
    ).toHaveProperty('access', 'private')
  })

  it('defaults deleting to false when the API omits it', () => {
    expect(parseComputeInstance(datum({}))).toHaveProperty('isDeleting', false)
    expect(parseComputeInstance(datum({ deleting: true }))).toHaveProperty('isDeleting', true)
  })

  it('falls back to failed for a build state it does not know', () => {
    expect(parseComputeInstance(datum({ build_state: 'exploded' }))).toHaveProperty(
      'buildState',
      'failed'
    )
  })

  it('rejects a response missing the fields the UI renders', () => {
    expect(() => parseComputeInstance({ id: 'embed', attributes: {} })).toThrow()
    expect(() => parseComputeInstance(undefined)).toThrow()
  })
})
