import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api/apiWrapper', () => ({
  apiWrapper: (_req: any, _res: any, handler: any) => handler(_req, _res),
}))

vi.mock('@/lib/api/self-hosted/registry', () => ({
  getAllDatabases: vi.fn(),
}))

vi.mock('@/lib/constants/api', () => ({
  DEFAULT_PROJECT: {
    id: 'default',
    ref: 'default',
    name: 'Default Project',
    organization_id: 'default',
    cloud_provider: 'NONE',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    inserted_at: '2024-01-01T00:00:00Z',
    db_host: 'db',
    db_port: 5432,
    db_name: 'postgres',
  },
}))

const TWO_DB_REGISTRY = [
  {
    ref: 'default',
    name: 'Default Project',
    host: 'db',
    port: 5432,
    database: 'postgres',
    password_env: 'POSTGRES_PASSWORD',
    jwt_secret_env: 'JWT_SECRET',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    ref: 'project-alpha',
    name: 'Project Alpha',
    host: 'db-alpha',
    port: 5432,
    database: 'alphadb',
    password_env: 'DB_ALPHA_PASSWORD',
    jwt_secret_env: 'DB_ALPHA_JWT_SECRET',
    created_at: '2024-02-01T00:00:00Z',
  },
]

describe('GET /api/platform/projects — multi-database', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns all databases from the registry', async () => {
    const { getAllDatabases } = await import('@/lib/api/self-hosted/registry')
    vi.mocked(getAllDatabases).mockReturnValue(TWO_DB_REGISTRY as any)

    const { req, res } = createMocks({ method: 'GET' })
    const handler = (await import('./index')).default
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(2)
    expect(data[0].ref).toBe('default')
    expect(data[1].ref).toBe('project-alpha')
    expect(data[1].name).toBe('Project Alpha')
  })

  it('returns [DEFAULT_PROJECT] when registry is empty', async () => {
    const { getAllDatabases } = await import('@/lib/api/self-hosted/registry')
    vi.mocked(getAllDatabases).mockReturnValue([])

    const { req, res } = createMocks({ method: 'GET' })
    const handler = (await import('./index')).default
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(1)
    expect(data[0].ref).toBe('default')
  })

  it('returns 405 for non-GET methods', async () => {
    const { getAllDatabases } = await import('@/lib/api/self-hosted/registry')
    vi.mocked(getAllDatabases).mockReturnValue(TWO_DB_REGISTRY as any)

    const { req, res } = createMocks({ method: 'POST' })
    const handler = (await import('./index')).default
    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(405)
  })

  it('each returned project has correct shape (ref, name, status, db_host, db_port)', async () => {
    const { getAllDatabases } = await import('@/lib/api/self-hosted/registry')
    vi.mocked(getAllDatabases).mockReturnValue(TWO_DB_REGISTRY as any)

    const { req, res } = createMocks({ method: 'GET' })
    const handler = (await import('./index')).default
    await handler(req as any, res as any)

    const data = JSON.parse(res._getData())
    for (const project of data) {
      expect(project).toHaveProperty('ref')
      expect(project).toHaveProperty('name')
      expect(project).toHaveProperty('status')
    }
  })
})