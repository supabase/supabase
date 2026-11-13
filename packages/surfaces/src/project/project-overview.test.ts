import { describe, expect, it } from 'vitest'

import { projectOverviewSchema } from '../contract'

describe('project overview contract', () => {
  it('rejects a ready advisor section without data, so missing data cannot read as clear', () => {
    const unavailable = { status: 'unavailable', message: 'Not available' }
    const overview = {
      projectId: 'project-ref',
      observedAt: '2026-11-09T00:00:00Z',
      start: '2026-11-08T00:00:00Z',
      end: '2026-11-09T00:00:00Z',
      traffic: unavailable,
      security: unavailable,
      performance: unavailable,
    }
    expect(projectOverviewSchema.safeParse(overview).success).toBe(true)
    expect(
      projectOverviewSchema.safeParse({ ...overview, security: { status: 'ready' } }).success
    ).toBe(false)
  })
})
