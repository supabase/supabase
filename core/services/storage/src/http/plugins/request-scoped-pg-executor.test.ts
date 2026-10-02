import Fastify from 'fastify'
import { vi } from 'vitest'

type PgLikeRequestDb = {
  pool: {
    acquire: ReturnType<typeof vi.fn>
  }
  query: ReturnType<typeof vi.fn>
  beginTransaction: ReturnType<typeof vi.fn>
}

async function loadPluginModules() {
  vi.resetModules()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    isMultitenant: false,
    vectorS3Buckets: ['vector-shard'],
  })

  const [{ icebergRestCatalog }, { s3vector }] = await Promise.all([
    import('./iceberg'),
    import('./vector'),
  ])

  return { icebergRestCatalog, s3vector }
}

function createRequestDb(): PgLikeRequestDb {
  return {
    pool: {
      acquire: vi.fn(() => {
        throw new Error('request-scoped plugins should not acquire a fixed pool executor')
      }),
    },
    query: vi.fn(),
    beginTransaction: vi.fn(),
  }
}

describe('request-scoped pg plugin executors', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('passes req.db to the Iceberg metastore without acquiring a fixed pool executor', async () => {
    const { icebergRestCatalog } = await loadPluginModules()
    const requestDb = createRequestDb()
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.decorateRequest('db')
    app.addHook('preHandler', async (req) => {
      req.tenantId = 'tenant-id'
      req.db = requestDb as never
    })
    await app.register(icebergRestCatalog)
    app.get('/iceberg', async (req) => {
      const metastore = (req.icebergCatalog as unknown as { options: { metastore: unknown } })
        .options.metastore

      return {
        usesRequestDb: (metastore as { db?: unknown }).db === requestDb,
        acquireCalls: requestDb.pool.acquire.mock.calls.length,
      }
    })

    try {
      const response = await app.inject('/iceberg')

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        usesRequestDb: true,
        acquireCalls: 0,
      })
    } finally {
      await app.close()
    }
  })

  it('passes req.db to the vector metadata store without acquiring a fixed pool executor', async () => {
    const { s3vector } = await loadPluginModules()
    const requestDb = createRequestDb()
    const app = Fastify()

    app.decorateRequest('tenantId')
    app.decorateRequest('db')
    app.addHook('preHandler', async (req) => {
      req.tenantId = 'tenant-id'
      req.db = requestDb as never
    })
    await app.register(s3vector)
    app.get('/vector', async (req) => {
      const metadataStore = (req.s3Vector as unknown as { db: unknown }).db

      return {
        usesRequestDb: (metadataStore as { db?: unknown }).db === requestDb,
        acquireCalls: requestDb.pool.acquire.mock.calls.length,
      }
    })

    try {
      const response = await app.inject('/vector')

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        usesRequestDb: true,
        acquireCalls: 0,
      })
    } finally {
      await app.close()
    }
  })
})
