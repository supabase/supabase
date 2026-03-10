import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'

vi.mock('lib/api/self-hosted/provisioner', () => ({
  getProvisioner: vi.fn(),
}))

vi.mock('lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lib/constants')>()
  return { ...actual, IS_PLATFORM: false }
})

import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import handler from 'pages/api/platform/projects/[ref]/api-keys'

const mockListProjects = vi.fn()

const mockProvisioner = {
  listProjects: mockListProjects,
}

const SAMPLE_PROJECT = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'acme',
  schema_name: 'co_acme',
  anon_key: 'eyJhbGci.ANON_FULL_KEY',
  service_key: 'eyJhbGci.SERVICE_FULL_KEY',
  status: 'active' as const,
  created_at: '2026-01-01T00:00:00Z',
}

describe('GET /api/platform/projects/[ref]/api-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('returns masked and full keys for existing project', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.anon_key.full).toBe('eyJhbGci.ANON_FULL_KEY')
    expect(data.service_key.full).toBe('eyJhbGci.SERVICE_FULL_KEY')
  })

  it('masks keys showing first 8 chars + ****', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data.anon_key.masked).toBe('eyJhbGci****')
    expect(data.service_key.masked).toBe('eyJhbGci****')
  })

  it('returns null for both fields when key is null', async () => {
    const projectWithNullKeys = { ...SAMPLE_PROJECT, anon_key: null, service_key: null }
    mockListProjects.mockResolvedValue([projectWithNullKeys])

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data.anon_key).toEqual({ masked: null, full: null })
    expect(data.service_key).toEqual({ masked: null, full: null })
  })

  it('returns 404 when project not found', async () => {
    mockListProjects.mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'nonexistent' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
  })
})
