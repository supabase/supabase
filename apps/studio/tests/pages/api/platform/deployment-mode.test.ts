import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '@/pages/api/platform/deployment-mode'
import { mswServer } from '@/tests/lib/msw'

const { mockIsCli } = vi.hoisted(() => ({ mockIsCli: { value: false } }))

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
  get IS_CLI() {
    return mockIsCli.value
  },
}))

describe('/api/platform/deployment-mode', () => {
  beforeEach(() => {
    mswServer.close()
    mockIsCli.value = false
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 405 for non-GET methods', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(res.getHeader('Allow')).toEqual(['GET'])
  })

  it('returns is_cli_mode: false when IS_CLI is false', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ is_cli_mode: false })
  })

  it('returns is_cli_mode: true when IS_CLI is true', async () => {
    mockIsCli.value = true
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ is_cli_mode: true })
  })
})
