vi.hoisted(() => {
  process.env.AUTH_URL_SIGNING_JWK_TYPE = 'HS512'
})

import { encrypt, signJWT } from '@internal/auth'
import { TENANT_CONFIG_CACHE_NAME } from '@internal/cache'
import {
  closeMultitenantPg,
  getDeleteObjectsLimit,
  jwksManager,
  multitenantPgExecutor,
  TenantMigrationStatus,
} from '@internal/database'
import { DBMigration } from '@internal/database/migrations'
import * as tenantModule from '@internal/database/tenant'
import {
  deleteTenantConfig,
  getFeatures,
  getFileSizeLimit,
  getServiceKey,
  getTenantConfig,
  onTenantConfigChange,
} from '@internal/database/tenant'
import * as metrics from '@internal/monitoring/metrics'
import { RunMigrationsOnTenants } from '@storage/events'
import dotenv from 'dotenv'
import * as migrate from '../internal/database/migrations/migrate'
import { adminApp } from './common'
import { assertLogicalLookupMetrics, getCacheRequestCalls } from './utils/cache-metrics'
import { mockCreateLruCache } from './utils/cache-mock'

dotenv.config({ path: '.env.test' })

const serviceKeyPayload = { abc: 123 }
const testTenantIds = ['abc', 'cache-test-abc'] as const

const migrationVersion = Object.entries(DBMigration).sort(([_, a], [__, b]) => b - a)[0][0]

const payload = {
  anonKey: 'a',
  databaseUrl: 'b',
  databasePoolUrl: 'v',
  maxConnections: 12,
  fileSizeLimit: 1,
  deleteObjectsLimit: 1500,
  jwtSecret: 'c',
  serviceKey: 'd',
  jwks: { keys: [] },
  migrationStatus: 'COMPLETED',
  migrationVersion,
  tracingMode: 'basic',
  subscriptionTier: 'tier_pro',
  capabilities: {
    list_V2: true,
    iceberg_catalog: true,
  },
  features: {
    imageTransformation: {
      enabled: true,
      maxResolution: null,
    },
    s3Protocol: {
      enabled: true,
    },
    purgeCache: {
      enabled: false,
    },
    icebergCatalog: {
      enabled: true,
      maxCatalogs: 2,
      maxNamespaces: 10,
      maxTables: 10,
    },
    vectorBuckets: {
      enabled: true,
      maxBuckets: 2,
      maxIndexes: 10,
    },
  },
  disableEvents: null,
}

const payload2 = {
  anonKey: 'e',
  databaseUrl: 'f',
  databasePoolUrl: 'm',
  maxConnections: 14,
  fileSizeLimit: 2,
  deleteObjectsLimit: 2000,
  jwtSecret: 'g',
  serviceKey: 'h',
  jwks: null,
  migrationStatus: 'COMPLETED',
  migrationVersion,
  tracingMode: 'basic',
  subscriptionTier: 'tier_free',
  capabilities: {
    list_V2: true,
    iceberg_catalog: true,
  },
  features: {
    imageTransformation: {
      enabled: false,
      maxResolution: null,
    },
    s3Protocol: {
      enabled: true,
    },
    purgeCache: {
      enabled: true,
    },
    icebergCatalog: {
      enabled: true,
      maxCatalogs: 2,
      maxNamespaces: 10,
      maxTables: 10,
    },
    vectorBuckets: {
      enabled: true,
      maxBuckets: 2,
      maxIndexes: 10,
    },
  },
  disableEvents: null,
}

function createEncryptedTenantRow(
  tenantId: string,
  tenantPayload: typeof payload | typeof payload2 = payload
) {
  return {
    id: tenantId,
    anon_key: encrypt(tenantPayload.anonKey),
    database_url: encrypt(tenantPayload.databaseUrl),
    database_pool_url: tenantPayload.databasePoolUrl
      ? encrypt(tenantPayload.databasePoolUrl)
      : tenantPayload.databasePoolUrl,
    max_connections: tenantPayload.maxConnections,
    file_size_limit: tenantPayload.fileSizeLimit,
    delete_objects_limit: tenantPayload.deleteObjectsLimit,
    jwt_secret: encrypt(tenantPayload.jwtSecret),
    jwks: tenantPayload.jwks,
    service_key: encrypt(tenantPayload.serviceKey),
    feature_purge_cache: tenantPayload.features.purgeCache.enabled,
    feature_image_transformation: tenantPayload.features.imageTransformation.enabled,
    feature_s3_protocol: tenantPayload.features.s3Protocol.enabled,
    feature_iceberg_catalog: tenantPayload.features.icebergCatalog.enabled,
    feature_iceberg_catalog_max_catalogs: tenantPayload.features.icebergCatalog.maxCatalogs,
    feature_iceberg_catalog_max_namespaces: tenantPayload.features.icebergCatalog.maxNamespaces,
    feature_iceberg_catalog_max_tables: tenantPayload.features.icebergCatalog.maxTables,
    feature_vector_buckets: tenantPayload.features.vectorBuckets.enabled,
    feature_vector_buckets_max_buckets: tenantPayload.features.vectorBuckets.maxBuckets,
    feature_vector_buckets_max_indexes: tenantPayload.features.vectorBuckets.maxIndexes,
    image_transformation_max_resolution: tenantPayload.features.imageTransformation.maxResolution,
    migrations_version: tenantPayload.migrationVersion,
    migrations_status: tenantPayload.migrationStatus,
    tracing_mode: tenantPayload.tracingMode,
    disable_events: tenantPayload.disableEvents,
    subscription_tier: tenantPayload.subscriptionTier,
  }
}

type TenantModule = typeof import('../internal/database/tenant')
type MultitenantPgModule = typeof import('../internal/database/multitenant-pg')

async function loadTenantModule(
  maxItems: number,
  cacheOverrides: Record<string, unknown> = {}
): Promise<{ tenantModule: TenantModule; multitenantPgModule: MultitenantPgModule }> {
  vi.resetModules()
  mockCreateLruCache({ max: maxItems, ...cacheOverrides })

  return {
    tenantModule: await import('../internal/database/tenant'),
    multitenantPgModule: await import('../internal/database/multitenant-pg'),
  }
}

function mockTenantQueryResult(row: object) {
  return {
    rows: [row],
    rowCount: 1,
  } as never
}

beforeAll(async () => {
  await migrate.runMultitenantMigrations()
  vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()
  payload.serviceKey = await signJWT(serviceKeyPayload, payload.jwtSecret, 100)
})

async function cleanupTestTenants() {
  for (const tenantId of testTenantIds) {
    await adminApp.inject({
      method: 'DELETE',
      url: `/tenants/${tenantId}`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
  }
}

beforeEach(async () => {
  await cleanupTestTenants()
})

afterEach(async () => {
  await cleanupTestTenants()
})

afterAll(async () => {
  await adminApp.close()
  await closeMultitenantPg()
})

describe('Tenant configs', () => {
  test('Get all tenant configs', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    const { capabilities, ...finalPayload } = payload

    expect(responseJSON).toEqual([
      {
        id: 'abc',
        ...finalPayload,
      },
    ])
  })

  test.each([
    0, -1,
  ])('Get all tenant configs omits non-positive delete objects limit %i', async (deleteObjectsLimit) => {
    const tenantId = `list-delete-objects-limit-${deleteObjectsLimit}`
    const encryptedTenant = {
      ...createEncryptedTenantRow(tenantId),
      delete_objects_limit: deleteObjectsLimit,
    }
    const querySpy = vi
      .spyOn(multitenantPgExecutor, 'query')
      .mockResolvedValueOnce(mockTenantQueryResult(encryptedTenant))

    try {
      const response = await adminApp.inject({
        method: 'GET',
        url: `/tenants`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)[0].deleteObjectsLimit).toBeUndefined()
    } finally {
      querySpy.mockRestore()
    }
  })

  test('Get nonexistent tenant config', async () => {
    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(404)
  })

  test('Get existing tenant config', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON).toEqual(payload)

    await expect(getServiceKey('abc')).resolves.toBe(payload.serviceKey)
    await expect(getFileSizeLimit('abc')).resolves.toBe(payload.fileSizeLimit)
    await expect(getDeleteObjectsLimit('abc')).resolves.toBe(payload.deleteObjectsLimit)
    await expect(getFeatures('abc')).resolves.toEqual(payload.features)
  })

  test('PATCH invalidates the local tenant config', async () => {
    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(createResponse.statusCode).toBe(201)

    await getTenantConfig('abc')
    const response = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: {
        databasePoolUrl: 'postgres://pool.example.test/postgres',
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(204)

    await expect(getTenantConfig('abc')).resolves.toMatchObject({
      databasePoolUrl: 'postgres://pool.example.test/postgres',
    })
  })

  test('Get tenant config omits sensitive data when ADMIN_RETURN_TENANT_SENSITIVE_DATA is false', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const previousValue = process.env.ADMIN_RETURN_TENANT_SENSITIVE_DATA
    process.env.ADMIN_RETURN_TENANT_SENSITIVE_DATA = 'false'
    let isolatedApp: typeof adminApp | undefined

    try {
      vi.resetModules()
      const { default: createApp } = await import('../admin-app')
      isolatedApp = createApp({})

      const singleResponse = await isolatedApp!.inject({
        method: 'GET',
        url: `/tenants/abc`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(singleResponse.statusCode).toBe(200)
      const singleJSON = JSON.parse(singleResponse.body)

      expect(singleJSON.anonKey).toBeUndefined()
      expect(singleJSON.databaseUrl).toBeUndefined()
      expect(singleJSON.databasePoolUrl).toBeUndefined()
      expect(singleJSON.jwtSecret).toBeUndefined()
      expect(singleJSON.jwks).toBeUndefined()
      expect(singleJSON.serviceKey).toBeUndefined()

      // Non-sensitive fields are still returned
      expect(singleJSON.fileSizeLimit).toBe(payload.fileSizeLimit)
      expect(singleJSON.maxConnections).toBe(payload.maxConnections)
      expect(singleJSON.features).toEqual(payload.features)
      expect(singleJSON.tracingMode).toBe(payload.tracingMode)
      expect(singleJSON.subscriptionTier).toBe(payload.subscriptionTier)

      const listResponse = await isolatedApp!.inject({
        method: 'GET',
        url: `/tenants`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(listResponse.statusCode).toBe(200)
      const listJSON = JSON.parse(listResponse.body)
      expect(listJSON).toHaveLength(1)
      expect(listJSON[0].id).toBe('abc')
      expect(listJSON[0].anonKey).toBeUndefined()
      expect(listJSON[0].databaseUrl).toBeUndefined()
      expect(listJSON[0].databasePoolUrl).toBeUndefined()
      expect(listJSON[0].jwtSecret).toBeUndefined()
      expect(listJSON[0].jwks).toBeUndefined()
      expect(listJSON[0].serviceKey).toBeUndefined()
      expect(listJSON[0].fileSizeLimit).toBe(payload.fileSizeLimit)
    } finally {
      await isolatedApp?.close()

      if (previousValue === undefined) {
        delete process.env.ADMIN_RETURN_TENANT_SENSITIVE_DATA
      } else {
        process.env.ADMIN_RETURN_TENANT_SENSITIVE_DATA = previousValue
      }
    }
  })

  test('Create tenant config preserves disableEvents and image transformation maxResolution', async () => {
    const createPayload = {
      ...payload,
      disableEvents: ['ObjectCreated:*', 'ObjectRemoved:*'],
      features: {
        ...payload.features,
        imageTransformation: {
          ...payload.features.imageTransformation,
          maxResolution: 1024,
        },
      },
    }

    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload: createPayload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(createResponse.statusCode).toBe(201)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    expect(JSON.parse(getResponse.body)).toEqual(createPayload)
  })

  test('Insert tenant config without required properties', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload: {},
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Insert tenant config twice', async () => {
    const firstInsertResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(firstInsertResponse.statusCode).toBe(201)
    const secondInsertResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(secondInsertResponse.statusCode).toBe(500)
  })

  test('Create tenant config rolls back when jwk generation fails', async () => {
    const generateUrlSigningJwkSpy = vi
      .spyOn(jwksManager, 'generateUrlSigningJwk')
      .mockRejectedValueOnce(new Error('jwk insert failed'))
    const runMigrationsOnTenantMock = vi.mocked(migrate.runMigrationsOnTenant)
    runMigrationsOnTenantMock.mockClear()

    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/abc`,
        payload,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(response.statusCode).toBe(500)
      expect(generateUrlSigningJwkSpy).toHaveBeenCalledWith('abc', 'HS512', expect.anything())
      expect(runMigrationsOnTenantMock).not.toHaveBeenCalled()

      const tenant = await multitenantPgExecutor.query({
        text: 'SELECT id FROM tenants WHERE id = $1 LIMIT 1',
        values: ['abc'],
      })
      const jwks = await multitenantPgExecutor.query({
        text: 'SELECT id FROM tenants_jwks WHERE tenant_id = $1',
        values: ['abc'],
      })

      expect(tenant.rows[0]).toBeUndefined()
      expect(jwks.rows).toEqual([])
    } finally {
      generateUrlSigningJwkSpy.mockRestore()
    }
  })

  test('Update tenant config', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const patchResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: payload2,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchResponse.statusCode).toBe(204)
    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const getResponseJSON = JSON.parse(getResponse.body)
    expect(getResponseJSON).toEqual(payload2)
  })

  test.each([
    'PUT',
    'PATCH',
  ] as const)('Update tenant config keeps changes when tenant migrations fail (%s)', async (method) => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const runMigrationsOnTenantMock = vi.mocked(migrate.runMigrationsOnTenant)
    const updateTenantMigrationsStateSpy = vi.spyOn(migrate, 'updateTenantMigrationsState')
    const onChangeSpy = vi.spyOn(tenantModule, 'onTenantConfigChange')
    const addTenantSpy = vi
      .spyOn(migrate.progressiveMigrations, 'addTenant')
      .mockImplementation(() => undefined)

    runMigrationsOnTenantMock.mockClear()
    updateTenantMigrationsStateSpy.mockClear()

    try {
      runMigrationsOnTenantMock.mockRejectedValueOnce(new Error('migration failed'))

      const response = await adminApp.inject({
        method,
        url: `/tenants/abc`,
        payload: payload2,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(response.statusCode).toBe(204)
      expect(runMigrationsOnTenantMock).toHaveBeenCalledWith(
        expect.objectContaining({
          databaseUrl: payload2.databaseUrl,
          tenantId: 'abc',
        })
      )
      expect(updateTenantMigrationsStateSpy).toHaveBeenCalledWith('abc', {
        state: TenantMigrationStatus.FAILED,
      })
      expect(addTenantSpy).toHaveBeenCalledWith('abc')
      expect(onChangeSpy.mock.invocationCallOrder[0]).toBeLessThan(
        addTenantSpy.mock.invocationCallOrder[0]
      )
      expect(await migrate.areMigrationsUpToDate('abc')).toBeFalsy()

      const getResponse = await adminApp.inject({
        method: 'GET',
        url: `/tenants/abc`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(getResponse.statusCode).toBe(200)
      expect(JSON.parse(getResponse.body)).toEqual({
        ...payload2,
        migrationStatus: TenantMigrationStatus.FAILED,
      })

      await RunMigrationsOnTenants.handle({
        data: { tenant: { ref: 'abc', host: '' }, tenantId: 'abc' },
      } as never)

      expect(runMigrationsOnTenantMock).toHaveBeenCalledTimes(2)

      const migrationsResponse = await adminApp.inject({
        method: 'GET',
        url: `/tenants/abc/migrations`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(JSON.parse(migrationsResponse.body)).toMatchObject({
        migrationsStatus: 'COMPLETED',
        isLatest: true,
      })
    } finally {
      addTenantSpy.mockRestore()
      updateTenantMigrationsStateSpy.mockRestore()
      onChangeSpy.mockRestore()
    }
  })

  test.each([
    'PUT',
    'PATCH',
  ] as const)('%s returns 500 and skips fallback scheduling when persisting FAILED state fails', async (method) => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const runMigrationsOnTenantMock = vi.mocked(migrate.runMigrationsOnTenant)
    const updateTenantMigrationsStateSpy = vi.spyOn(migrate, 'updateTenantMigrationsState')
    const addTenantSpy = vi
      .spyOn(migrate.progressiveMigrations, 'addTenant')
      .mockImplementation(() => undefined)
    const onChangeSpy = vi.spyOn(tenantModule, 'onTenantConfigChange')

    runMigrationsOnTenantMock.mockClear()
    updateTenantMigrationsStateSpy.mockClear()

    try {
      runMigrationsOnTenantMock.mockRejectedValueOnce(new Error('migration failed'))
      updateTenantMigrationsStateSpy.mockRejectedValueOnce(
        new Error('control database unavailable')
      )

      const response = await adminApp.inject({
        method,
        url: `/tenants/abc`,
        payload: payload2,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(response.statusCode).toBe(500)
      expect(addTenantSpy).not.toHaveBeenCalled()
      expect(onChangeSpy).toHaveBeenCalledWith('abc')
    } finally {
      addTenantSpy.mockRestore()
      updateTenantMigrationsStateSpy.mockRestore()
      onChangeSpy.mockRestore()
    }
  })

  test('Update tenant config partially', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const patchResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: { fileSizeLimit: 2 },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchResponse.statusCode).toBe(204)
    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const getResponseJSON = JSON.parse(getResponse.body)
    expect(getResponseJSON).toEqual({ ...payload, fileSizeLimit: 2 })
  })

  test('Update tenant config partially can disable globally enabled icebergCatalog', async () => {
    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(createResponse.statusCode).toBe(201)

    const patchResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: {
        features: {
          icebergCatalog: {
            enabled: false,
          },
        },
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchResponse.statusCode).toBe(204)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    expect(JSON.parse(getResponse.body).features.icebergCatalog).toEqual({
      ...payload.features.icebergCatalog,
      enabled: false,
    })

    deleteTenantConfig('abc')
    await expect(getTenantConfig('abc')).resolves.toMatchObject({
      features: {
        icebergCatalog: {
          ...payload.features.icebergCatalog,
          enabled: false,
        },
      },
    })
  })

  test('Update tenant config partially can disable globally enabled vectorBuckets', async () => {
    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(createResponse.statusCode).toBe(201)

    const patchResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: {
        features: {
          vectorBuckets: {
            enabled: false,
          },
        },
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchResponse.statusCode).toBe(204)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    expect(JSON.parse(getResponse.body).features.vectorBuckets).toEqual({
      ...payload.features.vectorBuckets,
      enabled: false,
    })

    deleteTenantConfig('abc')
    await expect(getTenantConfig('abc')).resolves.toMatchObject({
      features: {
        vectorBuckets: {
          ...payload.features.vectorBuckets,
          enabled: false,
        },
      },
    })
  })

  test('Tenant config change invalidates without eagerly reloading', async () => {
    const tenantId = 'tenant-config-change'
    const encryptedTenant = {
      ...createEncryptedTenantRow(tenantId),
      max_connections: 20,
    }
    const querySpy = vi
      .spyOn(multitenantPgExecutor, 'query')
      .mockResolvedValueOnce(mockTenantQueryResult(encryptedTenant))
      .mockResolvedValueOnce(
        mockTenantQueryResult({
          ...encryptedTenant,
          max_connections: 40,
        })
      )

    try {
      await expect(getTenantConfig(tenantId)).resolves.toMatchObject({ maxConnections: 20 })

      onTenantConfigChange(tenantId)
      expect(querySpy).toHaveBeenCalledTimes(1)

      await expect(getTenantConfig(tenantId)).resolves.toMatchObject({ maxConnections: 40 })
      expect(querySpy).toHaveBeenCalledTimes(2)
    } finally {
      deleteTenantConfig(tenantId)
      querySpy.mockRestore()
    }
  })

  test('Update tenant databasePoolUrl to null', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const patchResponse = await adminApp.inject({
      method: 'PATCH',
      url: `/tenants/abc`,
      payload: { databasePoolUrl: null },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(patchResponse.statusCode).toBe(204)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)

    const getResponseJSON = JSON.parse(getResponse.body)
    expect(getResponseJSON).toEqual({ ...payload, databasePoolUrl: null })
    expect(getResponseJSON.databasePoolUrl).toBeNull()
  })

  test('PUT clears tenant databasePoolUrl when set to null', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const putResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload: { ...payload, databasePoolUrl: null },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(putResponse.statusCode).toBe(204)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    expect(JSON.parse(getResponse.body).databasePoolUrl).toBeNull()
  })

  test('Upsert tenant config updates iceberg/vector limits when enabled is omitted', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const updatedValue = 999

    const putPayloadWithoutFeatureEnabled = {
      ...payload,
      features: {
        ...payload.features,
        icebergCatalog: {
          maxCatalogs: updatedValue,
          maxNamespaces: updatedValue,
          maxTables: updatedValue,
        },
        vectorBuckets: {
          maxBuckets: updatedValue,
          maxIndexes: updatedValue,
        },
      },
    }

    const putResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload: putPayloadWithoutFeatureEnabled,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(putResponse.statusCode).toBe(204)

    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)

    const getResponseJSON = JSON.parse(getResponse.body)
    expect(getResponseJSON.features.icebergCatalog).toEqual({
      enabled: payload.features.icebergCatalog.enabled,
      maxCatalogs: updatedValue,
      maxNamespaces: updatedValue,
      maxTables: updatedValue,
    })
    expect(getResponseJSON.features.vectorBuckets).toEqual({
      enabled: payload.features.vectorBuckets.enabled,
      maxBuckets: updatedValue,
      maxIndexes: updatedValue,
    })
  })

  test('Upsert tenant config updates disableEvents and image transformation maxResolution', async () => {
    const firstPayload = {
      ...payload,
      disableEvents: ['ObjectCreated:*', 'ObjectRemoved:*'],
      features: {
        ...payload.features,
        imageTransformation: {
          ...payload.features.imageTransformation,
          maxResolution: 1024,
        },
      },
    }

    const firstPutResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload: firstPayload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(firstPutResponse.statusCode).toBe(204)

    const firstGetResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(firstGetResponse.statusCode).toBe(200)
    expect(JSON.parse(firstGetResponse.body)).toEqual(firstPayload)

    const secondPayload = {
      ...payload2,
      disableEvents: ['ObjectCreated:*'],
      features: {
        ...payload2.features,
        imageTransformation: {
          ...payload2.features.imageTransformation,
          maxResolution: 2048,
        },
      },
    }

    const secondPutResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload: secondPayload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(secondPutResponse.statusCode).toBe(204)

    const secondGetResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(secondGetResponse.statusCode).toBe(200)
    expect(JSON.parse(secondGetResponse.body)).toEqual(secondPayload)
  })

  test('Upsert tenant config', async () => {
    const firstPutResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(firstPutResponse.statusCode).toBe(204)
    const firstGetResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const firstGetResponseJSON = JSON.parse(firstGetResponse.body)
    expect(firstGetResponseJSON).toEqual(payload)
    const secondPutResponse = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/abc`,
      payload: payload2,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(secondPutResponse.statusCode).toBe(204)
    const secondGetResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const secondGetResponseJSON = JSON.parse(secondGetResponse.body)
    expect(secondGetResponseJSON).toEqual(payload2)
  })

  test('Delete tenant config', async () => {
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/abc`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const deleteResponse = await adminApp.inject({
      method: 'DELETE',
      url: '/tenants/abc',
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteResponse.statusCode).toBe(204)
    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/abc`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(404)
  })

  test('Get tenant config with invalid tenant id expected error', async () => {
    await expect(getTenantConfig('')).rejects.toThrow('Invalid tenant id')
  })

  test('Get tenant config with unknown tenant id expected error', async () => {
    await expect(getTenantConfig('zzz')).rejects.toThrow('Missing tenant config for tenant zzz')
  })

  test.each([
    0, -1,
  ])('Get delete objects limit returns undefined for non-positive stored value %i', async (deleteObjectsLimit) => {
    const tenantId = `delete-objects-limit-${deleteObjectsLimit}`
    const encryptedTenant = {
      ...createEncryptedTenantRow(tenantId),
      delete_objects_limit: deleteObjectsLimit,
    }
    const querySpy = vi
      .spyOn(multitenantPgExecutor, 'query')
      .mockResolvedValueOnce(mockTenantQueryResult(encryptedTenant))

    try {
      await expect(getDeleteObjectsLimit(tenantId)).resolves.toBeUndefined()
    } finally {
      deleteTenantConfig(tenantId)
      querySpy.mockRestore()
    }
  })

  test('Get tenant config always retrieves concurrent requests from cache', async () => {
    const tenantId = 'cache-test-abc'
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}`,
      payload,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const querySpy = vi.spyOn(multitenantPgExecutor, 'query')
    try {
      await getTenantConfig(tenantId)
      expect(querySpy).toHaveBeenCalledTimes(1)

      const results = await Promise.all([
        getTenantConfig(tenantId),
        getTenantConfig(tenantId),
        getTenantConfig(tenantId),
      ])
      expect(querySpy).toHaveBeenCalledTimes(1)
      results.forEach((result, i) => expect(result).toEqual(results[i === 0 ? 1 : 0]))

      await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
    } finally {
      querySpy.mockRestore()
    }
  })

  test('Get tenant config evicts cold tenants from cache', async () => {
    const tenantIds = ['cache-eviction-1', 'cache-eviction-2', 'cache-eviction-3']
    const encryptedTenant = createEncryptedTenantRow(tenantIds[0])

    const { tenantModule, multitenantPgModule } = await loadTenantModule(2)
    const querySpy = vi
      .spyOn(multitenantPgModule.multitenantPgExecutor, 'query')
      .mockResolvedValue(mockTenantQueryResult(encryptedTenant))

    try {
      for (const tenantId of tenantIds) {
        await tenantModule.getTenantConfig(tenantId)
      }

      expect(querySpy).toHaveBeenCalledTimes(tenantIds.length)

      await tenantModule.getTenantConfig(tenantIds[0])

      expect(querySpy).toHaveBeenCalledTimes(tenantIds.length + 1)
    } finally {
      tenantIds.forEach((tenantId) => {
        tenantModule.deleteTenantConfig(tenantId)
      })
      vi.doUnmock('@internal/cache')
      vi.resetModules()
      querySpy.mockRestore()
    }
  })

  test('Get tenant config hot reads do not renew the absolute ttl', async () => {
    const tenantId = 'cache-absolute-ttl'
    const encryptedTenant = createEncryptedTenantRow(tenantId)
    let now = 1

    const { tenantModule, multitenantPgModule } = await loadTenantModule(2, {
      ttl: 10,
      ttlJitterRatio: 0,
      ttlResolution: 0,
      perf: { now: () => now },
    })
    const querySpy = vi
      .spyOn(multitenantPgModule.multitenantPgExecutor, 'query')
      .mockResolvedValue(mockTenantQueryResult(encryptedTenant))

    try {
      await tenantModule.getTenantConfig(tenantId)

      now = 5
      await tenantModule.getTenantConfig(tenantId)
      expect(querySpy).toHaveBeenCalledTimes(1)

      now = 12
      await tenantModule.getTenantConfig(tenantId)
      expect(querySpy).toHaveBeenCalledTimes(2)
    } finally {
      tenantModule.deleteTenantConfig(tenantId)
      vi.doUnmock('@internal/cache')
      vi.resetModules()
      querySpy.mockRestore()
    }
  })

  test('An invalidated config load retries through the current generation', async () => {
    const tenantId = 'tenant-config-invalidation-race'
    const oldTenant = {
      ...createEncryptedTenantRow(tenantId),
      database_url: encrypt('postgres://old-host'),
    }
    const newTenant = {
      ...oldTenant,
      database_url: encrypt('postgres://new-host'),
    }
    const oldQuery = Promise.withResolvers<ReturnType<typeof mockTenantQueryResult>>()
    const querySpy = vi
      .spyOn(multitenantPgExecutor, 'query')
      .mockReturnValueOnce(oldQuery.promise)
      .mockResolvedValueOnce(mockTenantQueryResult(newTenant))
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')

    try {
      recordSpy.mockClear()
      const staleLookup = getTenantConfig(tenantId)
      await vi.waitFor(() => expect(querySpy).toHaveBeenCalledTimes(1))

      onTenantConfigChange(tenantId)

      await expect(staleLookup).resolves.toMatchObject({
        databaseUrl: 'postgres://new-host',
      })
      expect(querySpy).toHaveBeenCalledTimes(2)
      expect(getCacheRequestCalls(recordSpy, TENANT_CONFIG_CACHE_NAME)).toEqual([
        [TENANT_CONFIG_CACHE_NAME, 'miss'],
      ])

      oldQuery.resolve(mockTenantQueryResult(oldTenant))
      await new Promise<void>((resolve) => setImmediate(resolve))

      await expect(getTenantConfig(tenantId)).resolves.toMatchObject({
        databaseUrl: 'postgres://new-host',
      })
      expect(getCacheRequestCalls(recordSpy, TENANT_CONFIG_CACHE_NAME)).toEqual([
        [TENANT_CONFIG_CACHE_NAME, 'miss'],
        [TENANT_CONFIG_CACHE_NAME, 'hit'],
      ])
    } finally {
      deleteTenantConfig(tenantId)
      querySpy.mockRestore()
      recordSpy.mockRestore()
    }
  })

  test('An invalidated config load that fails retries through the current generation', async () => {
    const tenantId = 'tenant-config-invalidation-error'
    const freshTenant = {
      ...createEncryptedTenantRow(tenantId),
      database_url: encrypt('postgres://fresh-host-after-error'),
    }
    const staleQuery = Promise.withResolvers<never>()
    const querySpy = vi
      .spyOn(multitenantPgExecutor, 'query')
      .mockReturnValueOnce(staleQuery.promise)
      .mockResolvedValueOnce(mockTenantQueryResult(freshTenant))

    try {
      const staleLookup = getTenantConfig(tenantId)
      await vi.waitFor(() => expect(querySpy).toHaveBeenCalledTimes(1))

      onTenantConfigChange(tenantId)
      const currentLookup = getTenantConfig(tenantId)
      staleQuery.reject(new Error('detached tenant config load failed'))

      await expect(Promise.all([staleLookup, currentLookup])).resolves.toEqual([
        expect.objectContaining({ databaseUrl: 'postgres://fresh-host-after-error' }),
        expect.objectContaining({ databaseUrl: 'postgres://fresh-host-after-error' }),
      ])
      expect(querySpy).toHaveBeenCalledTimes(2)
    } finally {
      deleteTenantConfig(tenantId)
      querySpy.mockRestore()
    }
  })

  test('Get tenant config records one cache request per logical lookup', async () => {
    const querySpy = vi.spyOn(multitenantPgExecutor, 'query')
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const tenantId = 'cache-metrics-lookup'
    const encryptedTenant = {
      ...createEncryptedTenantRow(tenantId),
      database_url: encrypt('postgres://tenant'),
    }

    const tenantQuery = Promise.withResolvers<never>()

    try {
      querySpy.mockImplementation(() => tenantQuery.promise)
      await assertLogicalLookupMetrics({
        recordSpy,
        backendCallSpy: querySpy,
        cacheName: TENANT_CONFIG_CACHE_NAME,
        startLookups: () => [
          getTenantConfig(tenantId),
          getTenantConfig(tenantId),
          getTenantConfig(tenantId),
        ],
        resolveBackend: () => tenantQuery.resolve(mockTenantQueryResult(encryptedTenant)),
        assertCachedHit: async () => {
          await expect(getTenantConfig(tenantId)).resolves.toMatchObject({
            databaseUrl: 'postgres://tenant',
          })
        },
      })
    } finally {
      deleteTenantConfig(tenantId)
      querySpy.mockRestore()
      recordSpy.mockRestore()
    }
  })
})
