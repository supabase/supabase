const previousEnv = vi.hoisted(() => {
  const values = {
    isMultitenant: process.env.IS_MULTITENANT,
    multiTenant: process.env.MULTI_TENANT,
    pgQueueEnable: process.env.PG_QUEUE_ENABLE,
  }

  process.env.PG_QUEUE_ENABLE = 'true'
  process.env.MULTI_TENANT = 'true'
  process.env.IS_MULTITENANT = 'true'

  return values
})

import { randomUUID } from 'node:crypto'
import { signJWT } from '@internal/auth'
import { JWKSManagerStorePg } from '@internal/auth/jwks'
import {
  closeMultitenantPg,
  getTenantConfig,
  jwksManager,
  multitenantPgExecutor,
  s3CredentialsManager,
  TenantMigrationStatus,
} from '@internal/database'
import { PG_BOSS_SCHEMA } from '@internal/queue'
import { RunMigrationsOnTenants } from '@storage/events'
import { S3CredentialsManagerStorePg } from '@storage/protocols/s3/credentials'
import { getConfig, mergeConfig } from '../config'
import * as migrate from '../internal/database/migrations/migrate'
import { adminApp } from './common'

getConfig({ reload: true })
mergeConfig({
  pgQueueEnable: true,
  isMultitenant: true,
})

const tenantId = 'pg-store-runtime'
const pgBossJobTable = `${PG_BOSS_SCHEMA}.job`

describe('pg store runtime selection', () => {
  beforeAll(async () => {
    await migrate.runMultitenantMigrations()
    await multitenantPgExecutor.query(`CREATE SCHEMA IF NOT EXISTS ${PG_BOSS_SCHEMA}`)
    await multitenantPgExecutor.query(`
      CREATE TABLE IF NOT EXISTS ${pgBossJobTable} (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        state text NOT NULL,
        created_on timestamptz NOT NULL DEFAULT now(),
        data jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `)
    vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()
    await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
  })

  afterAll(async () => {
    await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    await adminApp.close()
    await closeMultitenantPg()

    restoreEnv('IS_MULTITENANT', previousEnv.isMultitenant)
    restoreEnv('MULTI_TENANT', previousEnv.multiTenant)
    restoreEnv('PG_QUEUE_ENABLE', previousEnv.pgQueueEnable)
  })

  it('uses pg-backed leaf stores through admin routes', async () => {
    expect(jwksManager['storage']).toBeInstanceOf(JWKSManagerStorePg)
    expect(s3CredentialsManager['storage']).toBeInstanceOf(S3CredentialsManagerStorePg)

    const jwtSecret = 'pg-store-runtime-secret'
    const serviceKey = await signJWT({}, jwtSecret, 100)
    const createPayload = {
      anonKey: 'anon-key',
      databaseUrl: 'postgres://tenant-db',
      jwtSecret,
      serviceKey,
      features: {
        imageTransformation: {
          enabled: true,
          maxResolution: 1024,
        },
        purgeCache: {
          enabled: false,
        },
        s3Protocol: {
          enabled: true,
        },
      },
    }

    const createTenantResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}`,
      payload: createPayload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    expect(createTenantResponse.statusCode).toBe(201)

    const migrationsResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/migrations`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(migrationsResponse.statusCode).toBe(200)
    expect(migrationsResponse.json()).toMatchObject({
      isLatest: true,
      migrationsStatus: TenantMigrationStatus.COMPLETED,
    })
    expect(migrationsResponse.json().migrationsVersion).toBeTruthy()

    await expect(collectTenantsToResetMigrations()).resolves.toContain(tenantId)

    await migrate.updateTenantMigrationsState(tenantId, {
      migration: 'initialmigration',
      state: TenantMigrationStatus.COMPLETED,
    })

    await expect(collectTenantsToMigrate()).resolves.toContain(tenantId)

    const getTenantResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getTenantResponse.statusCode).toBe(200)
    expect(getTenantResponse.json()).toMatchObject({
      anonKey: createPayload.anonKey,
      databaseUrl: createPayload.databaseUrl,
      jwtSecret,
      serviceKey,
      features: createPayload.features,
    })

    const listTenantsResponse = await adminApp.inject({
      method: 'GET',
      url: '/tenants',
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(listTenantsResponse.statusCode).toBe(200)
    expect(listTenantsResponse.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: tenantId,
          anonKey: createPayload.anonKey,
          databaseUrl: createPayload.databaseUrl,
        }),
      ])
    )

    const patchTenantResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/${tenantId}`,
      payload: {
        databasePoolUrl: 'postgres://tenant-pool-db',
        maxConnections: 3,
        fileSizeLimit: 1234,
        features: {
          purgeCache: {
            enabled: true,
          },
        },
        disableEvents: ['ObjectCreated:*'],
        subscriptionTier: 'tier_pro',
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchTenantResponse.statusCode).toBe(204)

    await expect(getTenantConfig(tenantId)).resolves.toMatchObject({
      databaseUrl: createPayload.databaseUrl,
      databasePoolUrl: 'postgres://tenant-pool-db',
      fileSizeLimit: 1234,
      maxConnections: 3,
      disableEvents: ['ObjectCreated:*'],
      features: {
        purgeCache: {
          enabled: true,
        },
      },
      subscriptionTier: 'tier_pro',
    })

    const jwksConfig = await jwksManager.getJwksTenantConfig(tenantId)
    expect(jwksConfig.keys).toHaveLength(1)

    const createCredentialResponse = await adminApp.inject({
      method: 'POST',
      url: `/s3/${tenantId}/credentials`,
      payload: {
        description: 'pg runtime credential',
        claims: {
          role: 'service_role',
        },
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    expect(createCredentialResponse.statusCode).toBe(201)
    const credential = createCredentialResponse.json<{
      access_key: string
      secret_key: string
    }>()

    await expect(
      s3CredentialsManager.getS3CredentialsByAccessKey(tenantId, credential.access_key)
    ).resolves.toMatchObject({
      accessKey: credential.access_key,
      secretKey: credential.secret_key,
    })

    await migrate.updateTenantMigrationsState(tenantId, {
      state: TenantMigrationStatus.FAILED,
    })

    const failedMigrationsResponse = await adminApp.inject({
      method: 'GET',
      url: '/migrations/failed',
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(failedMigrationsResponse.statusCode).toBe(200)
    expect(failedMigrationsResponse.json().data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: tenantId,
        }),
      ])
    )

    const jobId = randomUUID()
    await multitenantPgExecutor.query({
      text: `
        INSERT INTO ${pgBossJobTable} (id, name, state, data)
        VALUES ($1, $2, $3, $4)
      `,
      values: [
        jobId,
        RunMigrationsOnTenants.getQueueName(),
        'active',
        {
          tenant: {
            ref: tenantId,
          },
          tenantId,
        },
      ],
    })

    const tenantJobsResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/migrations/jobs`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(tenantJobsResponse.statusCode).toBe(200)
    expect(tenantJobsResponse.json()).toEqual([
      expect.objectContaining({
        id: jobId,
        name: RunMigrationsOnTenants.getQueueName(),
      }),
    ])

    const deleteJobsResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantId}/migrations/jobs`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteJobsResponse.statusCode).toBe(200)
    expect(deleteJobsResponse.json()).toBe(1)

    const deleteTenantResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteTenantResponse.statusCode).toBe(204)

    const deletedTenantResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deletedTenantResponse.statusCode).toBe(404)
  })
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

async function collectTenantsToMigrate(): Promise<string[]> {
  const signal = new AbortController().signal
  const tenants: string[] = []

  for await (const batch of migrate.listTenantsToMigrate(signal)) {
    tenants.push(...batch)
  }

  return tenants
}

async function collectTenantsToResetMigrations(): Promise<string[]> {
  const signal = new AbortController().signal
  const tenants: string[] = []

  for await (const batch of migrate.listTenantsToResetMigrations('initialmigration', signal)) {
    tenants.push(...batch)
  }

  return tenants
}
