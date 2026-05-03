import { describe, expect, it } from 'vitest'

import {
  canAccessObservability,
  getObservabilityEntryRoute,
} from './ObservabilityAccess.utils'

describe('canAccessObservability', () => {
  it('allows observability on platform when reports are enabled', () => {
    expect(canAccessObservability({ isPlatform: true, reportsAll: true })).toBe(true)
  })

  it('blocks observability on platform when reports are disabled', () => {
    expect(canAccessObservability({ isPlatform: true, reportsAll: false })).toBe(false)
  })

  it('allows observability in self-hosted even when reports are disabled', () => {
    expect(canAccessObservability({ isPlatform: false, reportsAll: false })).toBe(true)
  })
})

describe('getObservabilityEntryRoute', () => {
  it('uses the overview route on platform', () => {
    expect(getObservabilityEntryRoute('project-ref', { isPlatform: true })).toBe(
      '/project/project-ref/observability'
    )
  })

  it('uses query performance as the self-hosted entry route', () => {
    expect(getObservabilityEntryRoute('project-ref', { isPlatform: false })).toBe(
      '/project/project-ref/observability/query-performance'
    )
  })
})
