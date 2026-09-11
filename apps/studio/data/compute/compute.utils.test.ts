import { describe, expect, it } from 'vitest'

import {
  COMPUTE_POLL_BASELINE_INTERVAL,
  COMPUTE_POLL_TRANSIENT_INTERVAL,
  computeInstanceRefetchInterval,
  computeRefetchInterval,
  parseComputeInstance,
} from './compute.utils'

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

describe('computeRefetchInterval', () => {
  const active = parseComputeInstance(datum({}))
  const building = parseComputeInstance(datum({ build_state: 'building' }))
  const deleting = parseComputeInstance(datum({ deleting: true }))

  it('keeps polling once every instance has settled', () => {
    expect(computeRefetchInterval([active])).toBe(COMPUTE_POLL_BASELINE_INTERVAL)
    expect(computeRefetchInterval([])).toBe(COMPUTE_POLL_BASELINE_INTERVAL)
    expect(computeRefetchInterval(undefined)).toBe(COMPUTE_POLL_BASELINE_INTERVAL)
  })

  it('polls faster while any instance is building or being deleted', () => {
    expect(computeRefetchInterval([active, building])).toBe(COMPUTE_POLL_TRANSIENT_INTERVAL)
    expect(computeRefetchInterval([active, deleting])).toBe(COMPUTE_POLL_TRANSIENT_INTERVAL)
  })
})

describe('computeInstanceRefetchInterval', () => {
  it('keeps polling once the instance has settled', () => {
    expect(computeInstanceRefetchInterval(parseComputeInstance(datum({})))).toBe(
      COMPUTE_POLL_BASELINE_INTERVAL
    )
    expect(computeInstanceRefetchInterval(undefined)).toBe(COMPUTE_POLL_BASELINE_INTERVAL)
  })

  it('polls faster while the instance is building or being deleted', () => {
    expect(
      computeInstanceRefetchInterval(parseComputeInstance(datum({ build_state: 'building' })))
    ).toBe(COMPUTE_POLL_TRANSIENT_INTERVAL)
    expect(computeInstanceRefetchInterval(parseComputeInstance(datum({ deleting: true })))).toBe(
      COMPUTE_POLL_TRANSIENT_INTERVAL
    )
  })
})
