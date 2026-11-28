import { describe, expect, it } from 'vitest'

import { Route } from '@/routes/api/platform/projects/$ref/api/rest'
import { callRoute } from '@/tests/lib/server-route'

describe('/api/platform/projects/$ref/api/rest', () => {
  it('returns 200 with an empty body on HEAD without calling PostgREST', async () => {
    const response = await callRoute(
      Route,
      new Request('http://localhost/api/platform/projects/default/api/rest', { method: 'HEAD' }),
      { ref: 'default' }
    )

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })
})
