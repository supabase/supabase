import { describe, expect, it } from 'vitest'

import {
  parseWorker,
  WORKER_POLL_BASELINE_INTERVAL,
  WORKER_POLL_TRANSIENT_INTERVAL,
  workerRefetchInterval,
  workersRefetchInterval,
} from './workers.utils'

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

describe('parseWorker', () => {
  it('maps the API response onto the view model', () => {
    expect(
      parseWorker(
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
      parseWorker(datum({ spec: { exposure: 'internal', instances: 1, size: '2gb-1vcpu' } }))
    ).toHaveProperty('access', 'private')
  })

  it('defaults deleting to false when the API omits it', () => {
    expect(parseWorker(datum({}))).toHaveProperty('isDeleting', false)
    expect(parseWorker(datum({ deleting: true }))).toHaveProperty('isDeleting', true)
  })

  it('falls back to failed for a build state it does not know', () => {
    expect(parseWorker(datum({ build_state: 'exploded' }))).toHaveProperty('buildState', 'failed')
  })

  it('rejects a response missing the fields the UI renders', () => {
    expect(() => parseWorker({ id: 'embed', attributes: {} })).toThrow()
    expect(() => parseWorker(undefined)).toThrow()
  })
})

describe('workersRefetchInterval', () => {
  const active = parseWorker(datum({}))
  const building = parseWorker(datum({ build_state: 'building' }))
  const deleting = parseWorker(datum({ deleting: true }))

  it('keeps polling once every worker has settled', () => {
    expect(workersRefetchInterval([active])).toBe(WORKER_POLL_BASELINE_INTERVAL)
    expect(workersRefetchInterval([])).toBe(WORKER_POLL_BASELINE_INTERVAL)
    expect(workersRefetchInterval(undefined)).toBe(WORKER_POLL_BASELINE_INTERVAL)
  })

  it('polls faster while any worker is building or being deleted', () => {
    expect(workersRefetchInterval([active, building])).toBe(WORKER_POLL_TRANSIENT_INTERVAL)
    expect(workersRefetchInterval([active, deleting])).toBe(WORKER_POLL_TRANSIENT_INTERVAL)
  })
})

describe('workerRefetchInterval', () => {
  it('keeps polling once the worker has settled', () => {
    expect(workerRefetchInterval(parseWorker(datum({})))).toBe(WORKER_POLL_BASELINE_INTERVAL)
    expect(workerRefetchInterval(undefined)).toBe(WORKER_POLL_BASELINE_INTERVAL)
  })

  it('polls faster while the worker is building or being deleted', () => {
    expect(workerRefetchInterval(parseWorker(datum({ build_state: 'building' })))).toBe(
      WORKER_POLL_TRANSIENT_INTERVAL
    )
    expect(workerRefetchInterval(parseWorker(datum({ deleting: true })))).toBe(
      WORKER_POLL_TRANSIENT_INTERVAL
    )
  })
})
