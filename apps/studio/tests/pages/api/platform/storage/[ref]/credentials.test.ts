import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '@/pages/api/platform/storage/[ref]/credentials'
import { mswServer } from '@/tests/lib/msw'

const { mockAccessKey } = vi.hoisted(() => ({ mockAccessKey: { value: '' } }))

vi.mock('@/lib/api/self-hosted/constants', () => ({
  get STORAGE_S3_ACCESS_KEY() {
    return mockAccessKey.value
  },
}))

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

describe('/api/platform/storage/[ref]/credentials', () => {
  beforeEach(() => {
    mswServer.close()
    mockAccessKey.value = ''
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 405 for non-GET methods', async () => {
    const { req, res } = createMocks({ method: 'POST', query: { ref: 'default' } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(res.getHeader('Allow')).toEqual(['GET'])
  })

  it('returns empty data when STORAGE_S3_ACCESS_KEY is unset', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({ data: [] })
  })

  it('synthesizes one credential row when STORAGE_S3_ACCESS_KEY is set', async () => {
    mockAccessKey.value = 'aws-test-access-key-id'
    const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
    await handler(req, res)

    const body = JSON.parse(res._getData())
    expect(body.data).toEqual([
      {
        id: 'aws-test-access-key-id',
        description: 'Default',
        access_key: 'aws-test-access-key-id',
      },
    ])
  })
})
