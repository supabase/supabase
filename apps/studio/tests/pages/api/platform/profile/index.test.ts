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
import handler from 'pages/api/platform/profile/index'

const mockListProjects = vi.fn()

const mockProvisioner = {
  listProjects: mockListProjects,
}

const SAMPLE_PROJECT = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'acme',
  schema_name: 'co_acme',
  anon_key: 'eyJhbGciOiJIUzI1NiJ9.anon',
  service_key: 'eyJhbGciOiJIUzI1NiJ9.service',
  status: 'active' as const,
  created_at: '2026-01-01T00:00:00Z',
}

describe('GET /api/platform/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('returns 200 with profile shape including projects', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.organizations[0].projects).toHaveLength(1)
    expect(data.organizations[0].projects[0].ref).toBe('acme')
  })

  it('returns 200 with empty projects array when provisioner throws', async () => {
    mockListProjects.mockRejectedValue(new Error('DB unavailable'))

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.organizations[0].projects).toEqual([])
  })

  it('preserves existing profile shape (id, primary_email, organizations)', async () => {
    mockListProjects.mockResolvedValue([])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('primary_email')
    expect(data).toHaveProperty('username')
    expect(data).toHaveProperty('organizations')
    expect(data.organizations).toHaveLength(1)
  })
})
