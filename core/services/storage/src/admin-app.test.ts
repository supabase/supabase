import { vi } from 'vitest'
import buildAdmin from './admin-app'
import { stripFiniteKeyword } from './http/finite'

const lastLocalMigrationName = vi.hoisted(() => vi.fn())
const onTenantConfigChange = vi.hoisted(() => vi.fn())
const tenantConfigUpdate = vi.hoisted(() => vi.fn())
const { adminApiKey, originalServerAdminApiKeys } = vi.hoisted(() => {
  const originalServerAdminApiKeys = process.env.SERVER_ADMIN_API_KEYS
  const adminApiKey = 'test-admin-api-key'
  process.env.SERVER_ADMIN_API_KEYS = adminApiKey
  return { adminApiKey, originalServerAdminApiKeys }
})

vi.mock('@internal/database', async () => {
  const actual = await vi.importActual<typeof import('@internal/database')>('@internal/database')

  return {
    ...actual,
    onTenantConfigChange,
    TenantConfigStorePg: class extends actual.TenantConfigStorePg {
      update = tenantConfigUpdate
    },
  }
})

vi.mock('@internal/database/migrations', async () => {
  const actual = await vi.importActual<typeof import('@internal/database/migrations')>(
    '@internal/database/migrations'
  )
  return {
    ...actual,
    lastLocalMigrationName,
  }
})

async function buildAdminApp(options: { exposeDocs?: boolean } = {}) {
  const app = buildAdmin(options)
  await app.ready()
  return app
}

describe('admin app', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SERVER_ADMIN_API_KEYS = adminApiKey
    lastLocalMigrationName.mockResolvedValue('storage-schema')
    onTenantConfigChange.mockResolvedValue(undefined)
    tenantConfigUpdate.mockResolvedValue(1)
  })

  afterAll(() => {
    if (originalServerAdminApiKeys === undefined) {
      delete process.env.SERVER_ADMIN_API_KEYS
    } else {
      process.env.SERVER_ADMIN_API_KEYS = originalServerAdminApiKeys
    }
  })

  it('registers shared Blob response handling', async () => {
    const app = await buildAdminApp()

    try {
      expect(app.hasPlugin('blob-response')).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('registers protected pprof endpoints', async () => {
    const app = await buildAdminApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/debug/pprof/profile',
      })

      expect(response.statusCode).toBe(401)
    } finally {
      await app.close()
    }
  })

  it('returns the stack migration version', async () => {
    lastLocalMigrationName.mockResolvedValue('create-migrations-table')

    const app = await buildAdminApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/migration-version',
        headers: {
          apikey: adminApiKey,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        migrationVersion: 'create-migrations-table',
      })
    } finally {
      await app.close()
    }
  })

  it('requires the admin API key for the stack migration version', async () => {
    const app = await buildAdminApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/migration-version',
      })

      expect(response.statusCode).toBe(401)
    } finally {
      await app.close()
    }
  })

  it('rejects every non-finite tenant field on create and update', async () => {
    const app = await buildAdminApp()

    try {
      const cases = [
        { name: 'maxConnections', payload: { maxConnections: 'Infinity' } },
        { name: 'fileSizeLimit', payload: { fileSizeLimit: '1e999' } },
        { name: 'deleteObjectsLimit', payload: { deleteObjectsLimit: '-Infinity' } },
        {
          name: 'image maxResolution',
          payload: { features: { imageTransformation: { maxResolution: 'Infinity' } } },
        },
        {
          name: 'Iceberg maxNamespaces',
          payload: { features: { icebergCatalog: { maxNamespaces: '1e999' } } },
        },
        {
          name: 'Iceberg maxTables',
          payload: { features: { icebergCatalog: { maxTables: '-Infinity' } } },
        },
        {
          name: 'Iceberg maxCatalogs',
          payload: { features: { icebergCatalog: { maxCatalogs: 'Infinity' } } },
        },
        {
          name: 'vector maxBuckets',
          payload: { features: { vectorBuckets: { maxBuckets: '1e999' } } },
        },
        {
          name: 'vector maxIndexes',
          payload: { features: { vectorBuckets: { maxIndexes: '-Infinity' } } },
        },
      ]

      for (const { name, payload } of cases) {
        const updateResponse = await app.inject({
          method: 'PATCH',
          url: '/tenants/test-tenant',
          headers: {
            apikey: adminApiKey,
          },
          payload,
        })

        expect(updateResponse.statusCode, `update ${name}`).toBe(400)
        expect(updateResponse.json().message, `update ${name}`).toContain('finite')

        const createResponse = await app.inject({
          method: 'POST',
          url: '/tenants/test-tenant',
          headers: {
            apikey: adminApiKey,
          },
          payload: {
            anonKey: 'anon-key',
            databaseUrl: 'postgresql://localhost/postgres',
            jwtSecret: 'jwt-secret',
            serviceKey: 'service-key',
            ...payload,
          },
        })

        expect(createResponse.statusCode, `create ${name}`).toBe(400)
        expect(createResponse.json().message, `create ${name}`).toContain('finite')
        expect(tenantConfigUpdate, name).not.toHaveBeenCalled()
      }
    } finally {
      await app.close()
    }
  })

  it('preserves null for nullable finite tenant fields', async () => {
    const app = await buildAdminApp()

    try {
      const response = await app.inject({
        method: 'PATCH',
        url: '/tenants/test-tenant',
        headers: {
          apikey: adminApiKey,
        },
        payload: {
          deleteObjectsLimit: null,
          features: {
            imageTransformation: {
              maxResolution: null,
            },
          },
        },
      })

      expect(response.statusCode).toBe(204)
      expect(tenantConfigUpdate).toHaveBeenCalledWith(
        'test-tenant',
        expect.objectContaining({
          delete_objects_limit: null,
          image_transformation_max_resolution: null,
        })
      )
    } finally {
      await app.close()
    }
  })

  it('does not expose the internal finite keyword in OpenAPI', async () => {
    const app = await buildAdminApp({ exposeDocs: true })

    try {
      const spec = app.swagger()
      expect(stripFiniteKeyword(spec)).toEqual(spec)
    } finally {
      await app.close()
    }
  })
})
