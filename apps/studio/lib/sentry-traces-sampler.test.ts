import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TRACES_SAMPLE_RATE,
  isPerfRoute,
  PERF_ROUTE_TRACES_SAMPLE_RATE,
  studioTracesSampler,
} from './sentry-traces-sampler'

describe('isPerfRoute', () => {
  it.each([
    '/project/$ref',
    '/project/$ref/',
    '/project/$ref/editor',
    '/project/$ref/editor/$id',
    '/project/$ref/sql/$id',
    '/project/$ref/auth/users',
    '/project/$ref/database/tables',
    '/project/abc123/editor',
    '/project/abc123',
  ])('treats %s as a perf route', (name) => {
    expect(isPerfRoute(name)).toBe(true)
  })

  it.each([
    '/',
    '/org/$slug',
    '/project/$ref/storage',
    '/project/$ref/settings/general',
    // A shared prefix isn't enough: `editor-foo` is a different route
    '/project/$ref/editor-foo',
    '/project',
  ])('treats %s as a regular route', (name) => {
    expect(isPerfRoute(name)).toBe(false)
  })
})

describe('studioTracesSampler', () => {
  // Mirrors Sentry's own `inheritOrSampleWith`: an upstream decision wins over the fallback rate.
  const sample = (name: string, parentSampled?: boolean) =>
    studioTracesSampler({
      name,
      parentSampled,
      inheritOrSampleWith: (fallback) =>
        parentSampled === undefined ? fallback : Number(parentSampled),
    })

  it('samples perf routes at the boosted rate', () => {
    expect(sample('/project/$ref/editor')).toBe(PERF_ROUTE_TRACES_SAMPLE_RATE)
  })

  it('samples everything else at the default rate', () => {
    expect(sample('/project/$ref/storage')).toBe(DEFAULT_TRACES_SAMPLE_RATE)
  })

  it('keeps the boost higher than the default', () => {
    expect(PERF_ROUTE_TRACES_SAMPLE_RATE).toBeGreaterThan(DEFAULT_TRACES_SAMPLE_RATE)
  })

  it('honors an upstream sampling decision on any route', () => {
    expect(sample('/project/$ref/editor', false)).toBe(0)
    expect(sample('/project/$ref/storage', true)).toBe(1)
  })
})
