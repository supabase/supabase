import Fastify from 'fastify'
import { vi } from 'vitest'

type VectorPluginModule = typeof import('./vector')
type MockPgPoolOptions = {
  application_name?: string
  connectionString?: string
  max?: number
  min?: number
}
type MockPgPool = {
  options: MockPgPoolOptions
  on: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
}

let createdPools: MockPgPool[] = []

async function loadVectorPlugin(
  configOverrides: Record<string, unknown> = {}
): Promise<VectorPluginModule> {
  vi.resetModules()
  mockPgModule()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    databaseApplicationName: 'storage-test',
    isMultitenant: false,
    vectorBucketProvider: 'pgvector',
    vectorDatabaseCreate: false,
    vectorDatabaseURL: 'postgres://user:password@db.example.test:5432/storage_vectors',
    ...configOverrides,
  } as Parameters<typeof configModule.mergeConfig>[0])

  return import('./vector')
}

function getLatestPool(): MockPgPool {
  const pool = createdPools.at(-1)

  if (!pool) {
    throw new Error('Expected pg Pool to be created')
  }

  return pool
}

function mockPgModule(): void {
  createdPools = []

  vi.doMock('pg', () => {
    const types = {
      setTypeParser: vi.fn(),
    }

    class DatabaseError extends Error {}

    class MockPool implements MockPgPool {
      readonly options: MockPgPoolOptions
      on = vi.fn()
      end = vi.fn(async () => undefined)

      constructor(options: MockPgPoolOptions) {
        this.options = options
        createdPools.push(this)
      }
    }

    return {
      DatabaseError,
      Pool: MockPool,
      types,
      default: {
        DatabaseError,
        Pool: MockPool,
        types,
      },
    }
  })
}

describe('s3vector plugin', () => {
  afterEach(() => {
    vi.doUnmock('pg')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('installs an idle error handler on the single-tenant pgvector pool', async () => {
    const { s3vector } = await loadVectorPlugin()
    const app = Fastify()

    try {
      await app.register(s3vector)

      expect(getLatestPool().on).toHaveBeenCalledWith('error', expect.any(Function))
    } finally {
      await app.close()
    }
  })
})
