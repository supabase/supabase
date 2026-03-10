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
import handler from 'pages/api/platform/projects/[ref]/index'

const mockListProjects = vi.fn()
const mockDropProject = vi.fn()

const mockProvisioner = {
  listProjects: mockListProjects,
  dropProject: mockDropProject,
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

describe('GET /api/platform/projects/[ref]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('returns project by ref name', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({
      method: 'GET',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.ref).toBe('acme')
    expect(data.name).toBe('acme')
    expect(data.status).toBe('ACTIVE_HEALTHY')
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

describe('DELETE /api/platform/projects/[ref]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('deletes project when confirm matches ref', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])
    mockDropProject.mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'DELETE',
      query: { ref: 'acme' },
      body: { confirm: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(204)
    expect(mockDropProject).toHaveBeenCalledWith('acme', { confirm: 'acme' })
  })

  it('returns 400 when confirm does not match', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { ref: 'acme' },
      body: { confirm: 'wrong-name' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(mockDropProject).not.toHaveBeenCalled()
  })

  it('returns 204 on successful deletion', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])
    mockDropProject.mockResolvedValue(undefined)

    const { req, res } = createMocks({
      method: 'DELETE',
      query: { ref: 'acme' },
      body: { confirm: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(204)
  })
})
