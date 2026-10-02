import { PgPoolExecutor } from '@internal/database'
import { Pool } from 'pg'
import { getConfig } from '../config'
import { runMultitenantMigrations } from '../internal/database/migrations'
import { S3CredentialsManagerStorePg } from '../storage/protocols/s3/credentials/store-pg'

const { databaseApplicationName, multitenantDatabaseUrl } = getConfig()

const tenantId = 'pg-store-s3-credentials'

describe('S3CredentialsManagerStorePg', () => {
  let pool: Pool
  let executor: PgPoolExecutor
  let store: S3CredentialsManagerStorePg

  beforeAll(async () => {
    await runMultitenantMigrations()

    pool = new Pool({
      connectionString: multitenantDatabaseUrl,
      application_name: databaseApplicationName,
      max: 2,
      min: 0,
    })
    executor = new PgPoolExecutor(pool)
    store = new S3CredentialsManagerStorePg(executor)
  })

  beforeEach(async () => {
    await executor.query(
      {
        text: `
          INSERT INTO tenants (
            id,
            anon_key,
            database_url,
            jwt_secret,
            service_key
          )
          VALUES ($1, 'anon', 'postgres://tenant', 'jwt-secret', 'service-key')
          ON CONFLICT (id) DO NOTHING
        `,
        values: [tenantId],
      },
      {}
    )
  })

  afterEach(async () => {
    await executor.query({
      text: 'DELETE FROM tenants WHERE id = $1',
      values: [tenantId],
    })
  })

  afterAll(async () => {
    await pool.end()
  })

  it('implements create, list, lookup, count, and delete', async () => {
    const id = await store.insert(tenantId, {
      description: 'pg store credential',
      accessKey: 'pg-store-access-key',
      secretKey: 'pg-store-secret-key',
      claims: {
        role: 'service_role',
        sub: 'user-1',
        custom: true,
      },
    })

    expect(id).toBeTruthy()
    await expect(store.count(tenantId)).resolves.toBe(1)

    await expect(store.list(tenantId)).resolves.toEqual([
      expect.objectContaining({
        id,
        description: 'pg store credential',
        access_key: 'pg-store-access-key',
        created_at: expect.any(Date),
      }),
    ])

    await expect(store.getOneByAccessKey(tenantId, 'pg-store-access-key')).resolves.toEqual({
      accessKey: 'pg-store-access-key',
      secretKey: 'pg-store-secret-key',
      claims: {
        role: 'service_role',
        sub: 'user-1',
        custom: true,
      },
    })

    await expect(store.delete(tenantId, id)).resolves.toBe(1)
    await expect(store.count(tenantId)).resolves.toBe(0)
  })

  it('returns the existing store semantics for missing rows', async () => {
    await expect(store.getOneByAccessKey(tenantId, 'missing-access-key')).resolves.toBeUndefined()
    await expect(store.delete(tenantId, '59e0ddab-3e41-451c-bc42-f8bb1387381d')).resolves.toBe(0)
  })
})
