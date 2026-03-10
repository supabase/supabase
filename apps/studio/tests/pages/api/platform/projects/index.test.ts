import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'

// Mock the provisioner module to avoid real DB connections
vi.mock('lib/api/self-hosted/provisioner', () => ({
  getProvisioner: vi.fn(),
}))

// Mock the IS_PLATFORM constant to be false (self-hosted mode)
vi.mock('lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lib/constants')>()
  return { ...actual, IS_PLATFORM: false }
})

import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import handler from 'pages/api/platform/projects/index'

const mockListProjects = vi.fn()
const mockCreateProject = vi.fn()

const mockProvisioner = {
  listProjects: mockListProjects,
  createProject: mockCreateProject,
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

describe('GET /api/platform/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('returns all projects from provisioner.listProjects()', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(1)
    expect(data[0].ref).toBe('acme')
    expect(data[0].name).toBe('acme')
  })

  it('maps provisioner status to Studio status (active -> ACTIVE_HEALTHY)', async () => {
    mockListProjects.mockResolvedValue([SAMPLE_PROJECT])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data[0].status).toBe('ACTIVE_HEALTHY')
  })

  it('returns projects sorted by created_at', async () => {
    const older = { ...SAMPLE_PROJECT, name: 'older', created_at: '2026-01-01T00:00:00Z' }
    const newer = { ...SAMPLE_PROJECT, name: 'newer', created_at: '2026-02-01T00:00:00Z' }
    // provisioner returns sorted by created_at ASC already
    mockListProjects.mockResolvedValue([older, newer])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data[0].name).toBe('older')
    expect(data[1].name).toBe('newer')
  })

  it('returns empty array when no projects exist', async () => {
    mockListProjects.mockResolvedValue([])

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual([])
  })
})

describe('POST /api/platform/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('creates project and returns 201 with Studio project shape', async () => {
    mockCreateProject.mockResolvedValue(SAMPLE_PROJECT)

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.ref).toBe('acme')
    expect(data.status).toBe('ACTIVE_HEALTHY')
    expect(mockCreateProject).toHaveBeenCalledWith({ name: 'acme' })
  })

  it('returns 400 for invalid project name', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: '' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  it('returns 500 when provisioner throws', async () => {
    mockCreateProject.mockRejectedValue(new Error('DB connection failed'))

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
  })
})
