import { describe, expect, it } from 'vitest'

import { Route } from '@/routes/api/connect/index'
import { callRoute } from '@/tests/lib/server-route'

describe('/api/connect', () => {
  it('returns each file path once and skips .DS_Store files', async () => {
    const response = await callRoute(Route, new Request('http://localhost/api/connect'))

    expect(response.status).toBe(200)
    const files: string[] = await response.json()
    expect(files.length).toBeGreaterThan(0)
    expect(new Set(files).size).toBe(files.length)
    expect(files.every((file) => !file.endsWith('.DS_Store'))).toBe(true)
  })
})
