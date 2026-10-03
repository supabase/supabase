vi.hoisted(() => {
  process.env.PG_QUEUE_ENABLE = 'true'
  process.env.MULTI_TENANT = 'true'
  process.env.IS_MULTITENANT = 'true'
  process.env.AUTH_URL_SIGNING_JWK_TYPE = 'HS512'
})

import { getConfig, mergeConfig } from '../config'

const { multitenantDatabaseUrl } = getConfig()
mergeConfig({
  pgQueueEnable: true,
  isMultitenant: true,
})

import { encrypt, signJWT, verifyJWT } from '@internal/auth'
import {
  deleteTenantJwksConfig,
  JWK_KIND_STORAGE_URL_SIGNING,
  JWK_KIND_STORAGE_URL_STANDBY,
  JWKSManagerStorePg,
} from '@internal/auth/jwks'
import { TENANTS_JWKS_UPDATE_CHANNEL } from '@internal/auth/jwks/constants'
import { UrlSigningJwkGenerator } from '@internal/auth/jwks/generator'
import { TENANT_JWKS_CACHE_NAME } from '@internal/cache'
import {
  closeMultitenantPg,
  deleteTenantConfig,
  getJwtSecret,
  getPublicJwks,
  jwksManager,
  listenForTenantUpdate,
} from '@internal/database'
import * as metrics from '@internal/monitoring/metrics'
import { PostgresPubSub } from '@internal/pubsub'
import { isUuid } from '@storage/limits'
import dotenv from 'dotenv'
import * as migrate from '../internal/database/migrations/migrate'
import { adminApp, mockQueue } from './common'
import { assertLogicalLookupMetrics, getCacheRequestCalls } from './utils/cache-metrics'
import { mockCreateLruCache } from './utils/cache-mock'
import {
  createConfigChangeAwaiter,
  createJwkConfigChangeAwaiter,
} from './utils/config-change-awaiter'
import { waitForEventually } from './utils/promise'

dotenv.config({ path: '.env.test' })

// Keep helper-level waits short so helper errors surface first.
const TENANT_CACHE_AWAITER_TIMEOUT_MS = 4000
const tenantId = 'abc123'
const TENANTS_UPDATE_CHANNEL = 'tenants_update'

const testJwks = {
  oct: {
    kty: 'oct',
    k: 'nrRW40eXW1wEzzqhsyIRieFZNrUA59sowrTTWLzPJks',
  },
  rsa: {
    kty: 'RSA',
    n: '21fa-bq1RLWAuHcpX_XGwGoroJxjFvqvlB_UStb-hT4aA-5DPwsHZgPGJQGvy7vYoKvF2e9ajtK5tFr0qGXX2gOlobC2sCDUJRowhlnKHmnZcVUQB3J6TQeZVGvT1_nG1OHyPjUO1BAgUhF3MQCnKuNel1MXRm2D-XRHFS1NN3-Xn2mDljWUN8tvzo51AormeRrdb-x_-I28wZkamp6mAiSZMWj_fJXHwUAYSB3ZHBH4Ay6j4Prs4R9gtCqguBO6hOaGLJh7trP-mS9pPEp0AdbKK5w64aZaQz65BMj5RAlh36VUkJkKFE6w79hS9DSnhF-qxCveYW8yT6OEHjzVCQ',
    e: 'AQAB',
    alg: 'RS256',
  },
  ec: {
    kty: 'EC',
    x: 'lrQU8Pt8cp47ctno-Kr9RvCO_6haU3au9fWE-X-XnR0',
    y: 'FCyiClHRp03d7rHkeugpo7qH4DirJBPoXv8GwPLWSNM',
    crv: 'P-256',
    alg: 'ES256',
  },
  okp: {
    crv: 'Ed25519',
    x: 'D-23h3lUY63Vjofh51cwFwMG5KfVDV10p0QLu2xGmXA',
    kty: 'OKP',
    alg: 'EdDSA',
  },
}

const pubSub = new PostgresPubSub(multitenantDatabaseUrl!)

type DatabaseModule = typeof import('../internal/database')
type JwksModule = typeof import('../internal/auth/jwks')

async function loadJwksModules(
  maxItems: number
): Promise<{ databaseModule: DatabaseModule; jwksModule: JwksModule }> {
  vi.resetModules()

  const configModule = await import('../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    pgQueueEnable: true,
    isMultitenant: true,
  })

  mockCreateLruCache({ max: maxItems })

  return {
    databaseModule: await import('../internal/database'),
    jwksModule: await import('../internal/auth/jwks'),
  }
}

beforeAll(async () => {
  await migrate.runMultitenantMigrations()
  await pubSub.start()
  await listenForTenantUpdate(pubSub)
  vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()
})

beforeEach(async () => {
  const jwtSecret = 'zzzzzzzzzzz'
  const serviceKey = await signJWT({}, jwtSecret, 100)
  await adminApp.inject({
    method: 'POST',
    url: `/tenants/${tenantId}`,
    payload: {
      anonKey: 'aaaa',
      databaseUrl: 'bbbb',
      jwtSecret,
      serviceKey,
    },
    headers: {
      apikey: process.env.ADMIN_API_KEYS,
    },
  })
})

afterEach(async () => {
  await adminApp.inject({
    method: 'DELETE',
    url: `/tenants/${tenantId}`,
    headers: {
      apikey: process.env.ADMIN_API_KEYS,
    },
  })
})

afterAll(async () => {
  await adminApp.close()
  await pubSub.close()
  await closeMultitenantPg()
})

describe('Tenant jwks configs', () => {
  test('JWK change awaiter ignores unrelated tenant notifications', async () => {
    const expectedTenantId = 'expected-jwks-tenant'
    const awaiter = createJwkConfigChangeAwaiter(
      pubSub,
      expectedTenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    let resolved = false

    void awaiter.then(() => {
      resolved = true
    })

    pubSub.subscriber.notifications.emit(TENANTS_JWKS_UPDATE_CHANNEL, 'other-jwks-tenant')
    await new Promise((resolve) => setImmediate(resolve))

    expect(resolved).toBe(false)

    pubSub.subscriber.notifications.emit(TENANTS_JWKS_UPDATE_CHANNEL, expectedTenantId)

    await expect(awaiter).resolves.toBe(expectedTenantId)
  })

  test('Add jwk without jwk in payload', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks`,
      payload: { kind: 'abc' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Add jwk with unknown kty', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks`,
      payload: { jwk: { kty: 'nonsense' }, kind: 'abc' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test(`Add jwk with kind that exceeds max length`, async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks`,
      payload: { jwk: testJwks.oct, kind: 'z'.repeat(51) },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test.each([
    JWK_KIND_STORAGE_URL_SIGNING,
    JWK_KIND_STORAGE_URL_STANDBY,
  ])('Add jwk with reserved kind %s is rejected', async (kind) => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks`,
      payload: { jwk: testJwks.oct, kind },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  Object.entries(testJwks).forEach(([type, jwk]) => {
    test(`Add ${type} jwk`, async () => {
      const kind = 'testing123'
      const { keys: keysBefore } = await jwksManager.getJwksTenantConfig(tenantId)
      const configAwaiter = createJwkConfigChangeAwaiter(
        pubSub,
        tenantId,
        TENANT_CACHE_AWAITER_TIMEOUT_MS
      )
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/${tenantId}/jwks`,
        payload: { jwk, kind },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })

      expect(response.statusCode).toBe(201)
      const data = response.json<{ kid: string }>()
      expect(data.kid).toBeTruthy()
      expect(isUuid(data.kid)).toBe(true)

      await expect(configAwaiter).resolves.toBe(tenantId)

      const config = await waitForEventually(
        () => jwksManager.getJwksTenantConfig(tenantId),
        (value) => value.keys.some((key) => key.kid === data.kid),
        `tenant ${tenantId} JWKS to include ${data.kid}`
      )
      expect(config.keys.length - keysBefore.length).toBe(1)
      expect(config.keys.find((v) => v.kid === data.kid)).toBeTruthy()
    })

    test(`Add ${type} jwk via tenant patch (legacy)`, async () => {
      const secretBeforePatch = await getJwtSecret(tenantId)
      const configAwaiter = createConfigChangeAwaiter(
        pubSub,
        TENANTS_UPDATE_CHANNEL,
        tenantId,
        TENANT_CACHE_AWAITER_TIMEOUT_MS
      )

      const patchResponse = await adminApp.inject({
        method: 'PATCH',
        url: `/tenants/${tenantId}`,
        payload: {
          jwks: { keys: [jwk] },
        },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(patchResponse.statusCode).toBe(204)
      await expect(configAwaiter).resolves.toBe(tenantId)

      deleteTenantConfig(tenantId)

      const secretAfterPatch = await getJwtSecret(tenantId)
      const secretAfterSecondRead = await getJwtSecret(tenantId)
      const { jwks } = secretAfterPatch

      expect(jwks.keys.length).toBe(2)
      expect(jwks.keys[1]).toEqual(jwk)
      expect(secretAfterPatch.secret).toBe(secretBeforePatch.secret)
      expect(secretAfterSecondRead.jwks).toBe(secretAfterPatch.jwks)
      expect(secretAfterSecondRead.jwks.keys).toEqual(jwks.keys)
    })

    test(`Add ${type} jwk with missing data`, async () => {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/${tenantId}/jwks`,
        payload: { jwk: { kty: jwk.kty }, kind: 'abc' },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(400)
    })

    if (type !== 'oct') {
      test(`Add ${type} jwk with private data`, async () => {
        const response = await adminApp.inject({
          method: 'POST',
          url: `/tenants/${tenantId}/jwks`,
          payload: { jwk: { ...jwk, d: 'zzzzzzz' }, kind: 'testing' },
          headers: {
            apikey: process.env.ADMIN_API_KEYS,
          },
        })
        expect(response.statusCode).toBe(400)
      })
    }
  })

  test('Update jwk (deactivate and reactivate)', async () => {
    let configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )

    const addResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks`,
      payload: { jwk: testJwks.oct, kind: 'testing123' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(addResponse.statusCode).toBe(201)
    const { kid } = addResponse.json<{ kid: string }>()

    await expect(configAwaiter).resolves.toBe(tenantId)

    let config = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.some((key) => key.kid === kid),
      `tenant ${tenantId} JWKS to include ${kid}`
    )
    expect(config.keys.length).toBe(2)

    configAwaiter = createJwkConfigChangeAwaiter(pubSub, tenantId, TENANT_CACHE_AWAITER_TIMEOUT_MS)
    let response = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/${tenantId}/jwks/${kid}`,
      payload: { active: false },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    let data = response.json<{ result: boolean }>()
    expect(data.result).toBe(true)

    await expect(configAwaiter).resolves.toBe(tenantId)

    config = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.length === 1,
      `tenant ${tenantId} JWKS to clear after deactivation`
    )
    expect(config.keys.length).toBe(1)
    expect(config.keys.some((key) => key.kid === kid)).toBe(false)

    configAwaiter = createJwkConfigChangeAwaiter(pubSub, tenantId, TENANT_CACHE_AWAITER_TIMEOUT_MS)
    response = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/${tenantId}/jwks/${kid}`,
      payload: { active: true },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    data = response.json<{ result: boolean }>()
    expect(data.result).toBe(true)

    await expect(configAwaiter).resolves.toBe(tenantId)

    const config2 = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.some((key) => key.kid === kid),
      `tenant ${tenantId} JWKS to restore ${kid}`
    )
    expect(config2.keys.length).toBe(2)
    expect(config2.keys.find((key) => key.kid === kid)).toMatchObject({ kid })
  })

  test('Cannot deactivate the current url signing key', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    expect(config.keys.length).toBe(1)
    const { kid } = config.keys[0]
    expect(config.urlSigningKey?.kid).toBe(kid)

    const getByIdSpy = vi.spyOn(jwksManager['storage'], 'getById')
    try {
      const response = await adminApp.inject({
        method: 'PUT',
        url: `/tenants/${tenantId}/jwks/${kid}`,
        payload: { active: false },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(409)
      expect(response.json()).toEqual({
        error: 'A url signing key cannot be toggled. Swap it with a standby key first',
      })

      expect(getByIdSpy).toHaveBeenCalledWith(tenantId, kid)
    } finally {
      getByIdSpy.mockRestore()
    }

    // the key must remain untouched - still present and still the active signing key
    const configAfter = await jwksManager.getJwksTenantConfig(tenantId)
    expect(configAfter.keys.length).toBe(1)
    expect(configAfter.urlSigningKey?.kid).toBe(kid)
  })

  test('Update unknown jwk', async () => {
    const response = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/${tenantId}/jwks/186e5fae-7b67-4939-b425-bbd649844163`,
      payload: { active: false },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Jwk not found' })
  })

  test('Update jwk with a malformed (non-uuid) kid is rejected', async () => {
    const response = await adminApp.inject({
      method: 'PUT',
      url: `/tenants/${tenantId}/jwks/fake-nonsense_186e5fae-7b67-4939-b425-bbd649844163`,
      payload: { active: false },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Config always retrieves concurrent requests from cache', async () => {
    const listActiveSpy = vi.spyOn(jwksManager['storage'], 'listActive')
    try {
      const results = await Promise.all([
        jwksManager.getJwksTenantConfig(tenantId),
        jwksManager.getJwksTenantConfig(tenantId),
        jwksManager.getJwksTenantConfig(tenantId),
      ])
      expect(listActiveSpy).toHaveBeenCalledTimes(1)
      results.forEach((result, i) => expect(result).toEqual(results[i === 0 ? 1 : 0]))
    } finally {
      listActiveSpy.mockRestore()
    }
  })

  test('JWKS invalidation cannot be undone by an older in-flight load', async () => {
    const lookupTenantId = 'jwks-invalidation-during-load'
    const staleJwk = {
      id: 'stale-key',
      kind: 'storage-url-signing-key',
      content: encrypt(JSON.stringify({ kty: 'oct', k: 'stale-secret' })),
      active: true,
    }
    const freshJwk = {
      id: 'fresh-key',
      kind: 'storage-url-signing-key',
      content: encrypt(JSON.stringify({ kty: 'oct', k: 'fresh-secret' })),
      active: true,
    }
    const staleRequest = Promise.withResolvers<Array<typeof staleJwk>>()
    const listActiveSpy = vi
      .spyOn(jwksManager['storage'], 'listActive')
      .mockReturnValueOnce(staleRequest.promise)
      .mockResolvedValueOnce([freshJwk])
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')

    try {
      recordSpy.mockClear()
      const staleLookup = jwksManager.getJwksTenantConfig(lookupTenantId)
      await vi.waitFor(() => expect(listActiveSpy).toHaveBeenCalledTimes(1))

      deleteTenantJwksConfig(lookupTenantId)

      await expect(staleLookup).resolves.toMatchObject({
        keys: [expect.objectContaining({ kid: 'fresh-key' })],
      })
      expect(listActiveSpy).toHaveBeenCalledTimes(2)
      expect(getCacheRequestCalls(recordSpy, TENANT_JWKS_CACHE_NAME)).toEqual([
        [TENANT_JWKS_CACHE_NAME, 'miss'],
      ])

      staleRequest.resolve([staleJwk])
      await new Promise<void>((resolve) => setImmediate(resolve))

      await expect(jwksManager.getJwksTenantConfig(lookupTenantId)).resolves.toMatchObject({
        keys: [expect.objectContaining({ kid: 'fresh-key' })],
      })
      expect(getCacheRequestCalls(recordSpy, TENANT_JWKS_CACHE_NAME)).toEqual([
        [TENANT_JWKS_CACHE_NAME, 'miss'],
        [TENANT_JWKS_CACHE_NAME, 'hit'],
      ])
    } finally {
      deleteTenantJwksConfig(lookupTenantId)
      listActiveSpy.mockRestore()
      recordSpy.mockRestore()
    }
  })

  test('JWKS invalidation retries an older in-flight load that fails', async () => {
    const lookupTenantId = 'jwks-invalidation-error'
    const freshJwk = {
      id: 'fresh-key-after-error',
      kind: 'storage-url-signing-key',
      content: encrypt(JSON.stringify({ kty: 'oct', k: 'fresh-secret' })),
      active: true,
    }
    const staleRequest = Promise.withResolvers<never>()
    const listActiveSpy = vi
      .spyOn(jwksManager['storage'], 'listActive')
      .mockReturnValueOnce(staleRequest.promise)
      .mockResolvedValueOnce([freshJwk])

    try {
      const staleLookup = jwksManager.getJwksTenantConfig(lookupTenantId)
      await vi.waitFor(() => expect(listActiveSpy).toHaveBeenCalledTimes(1))

      deleteTenantJwksConfig(lookupTenantId)
      const freshLookup = jwksManager.getJwksTenantConfig(lookupTenantId)
      staleRequest.reject(new Error('detached JWKS load failed'))

      await expect(Promise.all([staleLookup, freshLookup])).resolves.toEqual([
        expect.objectContaining({
          keys: [expect.objectContaining({ kid: 'fresh-key-after-error' })],
        }),
        expect.objectContaining({
          keys: [expect.objectContaining({ kid: 'fresh-key-after-error' })],
        }),
      ])
      expect(listActiveSpy).toHaveBeenCalledTimes(2)
    } finally {
      deleteTenantJwksConfig(lookupTenantId)
      listActiveSpy.mockRestore()
    }
  })

  test('Config evicts cold tenants from cache', async () => {
    const tenantIds = ['jwks-cache-eviction-1', 'jwks-cache-eviction-2', 'jwks-cache-eviction-3']
    const encryptedJwk = {
      id: 'cache-eviction',
      kind: 'storage-url-signing-key',
      content: encrypt(JSON.stringify({ kty: 'oct', k: 'bounded-cache-test-key' })),
      active: true,
    }

    const { databaseModule, jwksModule } = await loadJwksModules(2)
    const listActiveSpy = vi.spyOn(databaseModule.jwksManager['storage'], 'listActive')

    try {
      listActiveSpy.mockImplementation(async () => {
        return [encryptedJwk]
      })

      for (const tenantId of tenantIds) {
        await databaseModule.jwksManager.getJwksTenantConfig(tenantId)
      }

      expect(listActiveSpy).toHaveBeenCalledTimes(tenantIds.length)

      await databaseModule.jwksManager.getJwksTenantConfig(tenantIds[0])

      expect(listActiveSpy).toHaveBeenCalledTimes(tenantIds.length + 1)
    } finally {
      tenantIds.forEach((tenantId) => {
        jwksModule.deleteTenantJwksConfig(tenantId)
      })
      vi.doUnmock('@internal/cache')
      vi.resetModules()
      listActiveSpy.mockRestore()
    }
  })

  test('Config records one cache request per logical lookup', async () => {
    const listActiveSpy = vi.spyOn(jwksManager['storage'], 'listActive')
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const lookupTenantId = 'jwks-cache-metrics-lookup'
    const encryptedJwk = {
      id: 'cache-metrics',
      kind: 'storage-url-signing-key',
      content: encrypt(JSON.stringify({ kty: 'oct', k: 'metric-cache-test-key' })),
      active: true,
    }

    const listActiveRequest = Promise.withResolvers<Array<typeof encryptedJwk>>()

    try {
      listActiveSpy.mockImplementation(() => listActiveRequest.promise)

      await assertLogicalLookupMetrics({
        recordSpy,
        backendCallSpy: listActiveSpy,
        cacheName: TENANT_JWKS_CACHE_NAME,
        startLookups: () => [
          jwksManager.getJwksTenantConfig(lookupTenantId),
          jwksManager.getJwksTenantConfig(lookupTenantId),
          jwksManager.getJwksTenantConfig(lookupTenantId),
        ],
        resolveBackend: () => listActiveRequest.resolve([encryptedJwk]),
        assertCachedHit: async () => {
          await expect(jwksManager.getJwksTenantConfig(lookupTenantId)).resolves.toMatchObject({
            keys: [expect.objectContaining({ kid: 'cache-metrics' })],
          })
        },
      })
    } finally {
      listActiveSpy.mockRestore()
      recordSpy.mockRestore()
    }
  })

  test('Generate all jwks status', async () => {
    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/jwks/generate-all-missing`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    const statusBefore = response.json<{ running: boolean }>()
    expect(statusBefore.running).toBe(false)
  })

  test('Generate all jwks', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    expect(config.keys.length).toBe(1)
    const { kid } = config.keys[0]
    expect(kid).toBeDefined()
    // disable url signing jwt added when tenant was created - bypasses the admin route
    // directly since it now refuses to deactivate the current url signing key
    await jwksManager.toggleJwkActive(tenantId, kid!, false, null)

    const queueInsertSpy = mockQueue().insertSpy
    const queueSpyAwaiter = new Promise((resolve) => {
      queueInsertSpy.mockImplementationOnce((...args) => resolve(args))
    })
    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/jwks/generate-all-missing`,
        payload: {},
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(200)
      const startData = response.json<{ started: boolean }>()
      expect(startData.started).toBe(true)

      await queueSpyAwaiter
      expect(queueInsertSpy).toHaveBeenCalledTimes(1)
      const [[callArg]] = queueInsertSpy.mock.calls
      expect(callArg).toHaveLength(1)
      expect(callArg[0]).toMatchObject({ data: { tenantId }, name: 'tenants-jwks-create-v2' })
    } finally {
      queueInsertSpy.mockRestore()
    }
  })

  test('Generate all jwks when already running', async () => {
    const statusSpy = vi
      .spyOn(UrlSigningJwkGenerator, 'getGenerationStatus')
      .mockReturnValueOnce({ running: true, sent: 99 })

    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/jwks/generate-all-missing`,
        payload: {},
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(400)
      expect(statusSpy).toHaveBeenCalledTimes(1)
    } finally {
      statusSpy.mockRestore()
    }
  })

  test('Ensure list tenants exits before yield if no items are returned', async () => {
    const listTenantsSpy = vi
      .spyOn(jwksManager['storage'], 'listTenantsWithoutKindPaginated')
      .mockResolvedValue([])
    try {
      const result = jwksManager.listTenantsMissingUrlSigningJwk(new AbortController().signal)

      let iterations = 0
      for await (const _ of result) {
        iterations++
      }
      expect(iterations).toBe(0)
      expect(listTenantsSpy).toHaveBeenCalledTimes(1)
    } finally {
      listTenantsSpy.mockRestore()
    }
  })

  test('Should use url signing jwk and fall back to old jwt secret when the jwk is removed', async () => {
    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )

    const secretWithJwk = await getJwtSecret(tenantId)
    expect(secretWithJwk.urlSigningKey).not.toBe(secretWithJwk.secret)
    expect(secretWithJwk.jwks.keys.length).toBe(1)
    expect(secretWithJwk.jwks.keys[0]).toEqual(secretWithJwk.urlSigningKey)

    const config = await jwksManager.getJwksTenantConfig(tenantId)
    expect(config.keys.length).toBe(1)
    const { kid } = config.keys[0]
    expect(kid).toBeDefined()
    // disable url signing jwt added when tenant was created - bypasses the admin route
    // directly since it now refuses to deactivate the current url signing key
    await jwksManager.toggleJwkActive(tenantId, kid!, false, null)

    await expect(configAwaiter).resolves.toBe(tenantId)

    deleteTenantConfig(tenantId)

    const secretWithoutJwk = await waitForEventually(
      () => getJwtSecret(tenantId),
      (value) => value.urlSigningKey === value.secret && value.jwks.keys.length === 0,
      `tenant ${tenantId} url signing fallback to jwtSecret`
    )
    expect(secretWithoutJwk.urlSigningKey).toBe(secretWithoutJwk.secret)
    expect(secretWithoutJwk.jwks.keys.length).toBe(0)
  })

  test('Ensure url signing jwk is idempotent', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    // signing jwk created automatically for new tenant
    expect(config.keys.length).toBe(1)
    const kidBefore = config.keys[0].kid

    const results = await Promise.all([
      jwksManager.generateUrlSigningJwk(tenantId, 'ES256'),
      jwksManager.generateUrlSigningJwk(tenantId, 'HS512'),
      jwksManager.generateUrlSigningJwk(tenantId, 'ES256'),
    ])

    results.forEach((result) => expect(result.kid).toBe(kidBefore))
  })

  test('Storage.insert correctly throws if insert fails when not idempotent', async () => {
    const storage = new JWKSManagerStorePg({
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as never)
    const insert = storage.insert('tenant-id', 'encrypted', 'kind')
    await expect(insert).rejects.toThrow('failed to insert jwk')
  })

  test('Storage.insert correctly throws if fails to find conflicting row during idempotent insert', async () => {
    const storage = new JWKSManagerStorePg({
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] }),
    } as never)
    const insert = storage.insert('tenant-id', 'encrypted', 'kind', true)
    await expect(insert).rejects.toThrow('failed to find existing jwk on idempotent insert')
  })

  test('Roll url signing key', async () => {
    const queueSendSpy = mockQueue().sendSpy
    const queueSpyAwaiter = new Promise((resolve) => {
      queueSendSpy.mockImplementationOnce((...args) => {
        resolve(args)
      })
    })
    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/tenants/${tenantId}/jwks/url-signing/roll`,
        payload: { type: 'ES256' },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
          'sb-request-id': 'sb-req-123',
        },
      })
      expect(response.statusCode).toBe(200)
      const data = response.json<{ started: boolean }>()
      expect(data.started).toBe(true)

      await queueSpyAwaiter
      expect(queueSendSpy).toHaveBeenCalledTimes(1)
      const [[callArg]] = queueSendSpy.mock.calls
      expect(callArg).toMatchObject({
        data: { tenantId, sbReqId: 'sb-req-123', keyType: 'ES256' },
        name: 'tenants-jwks-roll-url-signing-key-v1',
      })
    } finally {
      queueSendSpy.mockRestore()
    }
  })

  test('Roll url signing key requires a type', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/roll`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Roll url signing key when no key exists', async () => {
    let configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )

    const config = await jwksManager.getJwksTenantConfig(tenantId)
    expect(config.keys.length).toBe(1)
    const { kid } = config.keys[0]
    expect(kid).toBeDefined()
    await jwksManager.toggleJwkActive(tenantId, kid!, false, null)

    await expect(configAwaiter).resolves.toBe(tenantId)

    const configBeforeRoll = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.length === 0,
      `tenant ${tenantId} JWKS to clear after deactivation`
    )
    expect(configBeforeRoll.keys.length).toBe(0)

    configAwaiter = createJwkConfigChangeAwaiter(pubSub, tenantId, TENANT_CACHE_AWAITER_TIMEOUT_MS)
    const { oldKid, newKid } = await jwksManager.rollUrlSigningJwk(tenantId, 'ES256')

    expect(oldKid).toBeNull()
    expect(isUuid(newKid)).toBe(true)

    await expect(configAwaiter).resolves.toBe(tenantId)
    const configAfterRoll = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.length === 1,
      `tenant ${tenantId} JWKS to clear after deactivation`
    )
    expect(configAfterRoll.keys.length).toBe(1)
    expect(configAfterRoll.keys[0].kid).toBe(newKid)
  })

  test('Roll url signing key atomically replaces existing key', async () => {
    const configBefore = await jwksManager.getJwksTenantConfig(tenantId)
    expect(configBefore.keys.length).toBe(1)
    const oldKid = configBefore.keys[0].kid

    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const { oldKid: returnedOldKid, newKid } = await jwksManager.rollUrlSigningJwk(
      tenantId,
      'ES256'
    )

    expect(returnedOldKid).toBe(oldKid)
    expect(newKid).not.toBe(oldKid)
    expect(isUuid(newKid)).toBe(true)

    await expect(configAwaiter).resolves.toBe(tenantId)
    const configAfter = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys[0].kid !== oldKid,
      `tenant ${tenantId} JWKS to clear after deactivation`
    )

    await jwksManager.getJwksTenantConfig(tenantId)
    expect(configAfter.keys.length).toBe(1)
    expect(configAfter.keys[0].kid).toBe(newKid)

    const activeKeys = await jwksManager['storage'].listActive(tenantId, 'storage-url-signing-key')
    expect(activeKeys.length).toBe(1)
    expect(activeKeys[0].id).toBe(newKid)
  })

  test('List jwks', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    expect(config.keys.length).toBe(1)
    const { kid, kty } = config.keys[0] as { kid: string; kty: string }

    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const standbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const { kid: standbyKid } = standbyResponse.json<{ kid: string }>()
    await expect(configAwaiter).resolves.toBe(tenantId)

    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/jwks`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    const data = response.json<Array<Record<string, unknown>>>()
    expect(data).toHaveLength(2)
    expect(data).toContainEqual({ kid, kind: 'storage-url-signing-key', type: kty, active: true })
    expect(data).toContainEqual({
      kid: standbyKid,
      kind: 'storage-url-standby-key',
      type: 'EC',
      active: true,
    })

    // store.list also returns the encrypted jwk content
    // assert the exact key set so leaking it (or anything else added later) through listJwks fails this test
    data.forEach((jwk) =>
      expect(Object.keys(jwk).sort()).toEqual(['active', 'kid', 'kind', 'type'])
    )
  })

  test('List jwks includes inactive keys', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    const { kid } = config.keys[0]
    expect(kid).toBeDefined()

    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    await jwksManager.toggleJwkActive(tenantId, kid!, false, null)
    await expect(configAwaiter).resolves.toBe(tenantId)

    const response = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/jwks`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(200)
    const data =
      response.json<Array<{ kid: string; kind: string; type: string; active: boolean }>>()
    expect(data.find((jwk) => jwk.kid === kid)).toMatchObject({
      kind: 'storage-url-signing-key',
      active: false,
    })
  })

  test('Generate standby url signing key', async () => {
    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(201)
    const data = response.json<{ kid: string }>()
    expect(isUuid(data.kid)).toBe(true)

    await expect(configAwaiter).resolves.toBe(tenantId)

    const config = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.some((key) => key.kid === data.kid),
      `tenant ${tenantId} JWKS to include standby key ${data.kid}`
    )
    // standby keys are active (valid for verification) but are not selected as the signing key for new urls
    expect(config.keys.some((key) => key.kid === data.kid)).toBe(true)
    expect(config.urlSigningKey?.kid).not.toBe(data.kid)

    const listResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/jwks`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const list =
      listResponse.json<Array<{ kid: string; kind: string; type: string; active: boolean }>>()
    expect(list).toContainEqual({
      kid: data.kid,
      kind: 'storage-url-standby-key',
      type: 'EC',
      active: true,
    })
  })

  test('Generate standby url signing key with invalid type', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'RS256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Swap standby and active url signing keys', async () => {
    const configBefore = await jwksManager.getJwksTenantConfig(tenantId)
    expect(configBefore.keys.length).toBe(1)
    const oldActiveKid = configBefore.keys[0].kid
    expect(oldActiveKid).toBeTruthy()

    const standbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const { kid: standbyKid } = standbyResponse.json<{ kid: string }>()

    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const swapResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/${standbyKid}/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(swapResponse.statusCode).toBe(201)
    expect(swapResponse.body).toBe('')

    await expect(configAwaiter).resolves.toBe(tenantId)

    const configAfter = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.urlSigningKey?.kid === standbyKid,
      `tenant ${tenantId} JWKS to promote standby ${standbyKid} to active`
    )

    expect(configAfter.keys.length).toBe(2)
    // the pre-swap active key is still present under its unchanged kid, now as a standby
    expect(configAfter.keys.some((key) => key.kid === oldActiveKid)).toBe(true)
    expect(configAfter.urlSigningKey?.kid).toBe(standbyKid)

    const listResponse = await adminApp.inject({
      method: 'GET',
      url: `/tenants/${tenantId}/jwks`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const list =
      listResponse.json<Array<{ kid: string; kind: string; type: string; active: boolean }>>()
    expect(
      list.some(
        (jwk) => jwk.kid === standbyKid && jwk.kind === 'storage-url-signing-key' && jwk.active
      )
    ).toBe(true)
    expect(
      list.some(
        (jwk) => jwk.kid === oldActiveKid && jwk.kind === 'storage-url-standby-key' && jwk.active
      )
    ).toBe(true)
  })

  test('Swapping back after an initial swap succeeds', async () => {
    const configBefore = await jwksManager.getJwksTenantConfig(tenantId)
    const originalActiveKid = configBefore.keys[0].kid
    expect(originalActiveKid).toBeTruthy()

    const standbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const { kid: standbyKid } = standbyResponse.json<{ kid: string }>()

    const firstSwapAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const firstSwap = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/${standbyKid}/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(firstSwap.statusCode).toBe(201)
    await expect(firstSwapAwaiter).resolves.toBe(tenantId)

    await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.urlSigningKey?.kid !== originalActiveKid,
      `tenant ${tenantId} JWKS to promote the standby key to active`
    )

    // swap back - the original active key (now labeled standby) is now the swap target
    const secondSwapAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const secondSwap = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/${originalActiveKid}/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(secondSwap.statusCode).toBe(201)
    expect(secondSwap.body).toBe('')
    await expect(secondSwapAwaiter).resolves.toBe(tenantId)

    const configAfter = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.urlSigningKey?.kid === originalActiveKid,
      `tenant ${tenantId} JWKS to promote ${originalActiveKid} back to active`
    )
    expect(configAfter.keys.length).toBe(2)
  })

  test('A jwt signed with the pre-swap active key still verifies after the standby swap', async () => {
    const configBefore = await jwksManager.getJwksTenantConfig(tenantId)
    const oldActiveKey = configBefore.urlSigningKey
    expect(oldActiveKey).toBeTruthy()

    // signed while this key is still the tenant's active url signing key
    const token = await signJWT({ sub: 'pre-swap-url' }, oldActiveKey!, 100)

    const standbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    const { kid: standbyKid } = standbyResponse.json<{ kid: string }>()

    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    const swapResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/${standbyKid}/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(swapResponse.statusCode).toBe(201)
    await expect(configAwaiter).resolves.toBe(tenantId)

    const configAfter = await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.urlSigningKey?.kid !== oldActiveKey!.kid,
      `tenant ${tenantId} JWKS to promote the standby key to active`
    )

    await expect(verifyJWT(token, 'unused-fallback-secret', configAfter)).resolves.toMatchObject({
      sub: 'pre-swap-url',
    })
  })

  test('A jwt signed with a legacy "kind_id" kid still verifies against the current bare-id jwk', async () => {
    const config = await jwksManager.getJwksTenantConfig(tenantId)
    const activeKey = config.urlSigningKey
    expect(activeKey).toBeTruthy()

    // simulates a long-lived signed URL issued before kids stopped encoding kind - the
    // underlying jwk is unchanged, only the header's kid uses the retired "<kind>_<id>" format
    const legacySigningJwk = {
      ...activeKey!,
      kid: `storage-url-signing-key_${activeKey!.kid}`,
    }
    const token = await signJWT({ sub: 'legacy-kid-url' }, legacySigningJwk, 100)

    await expect(verifyJWT(token, 'unused-fallback-secret', config)).resolves.toMatchObject({
      sub: 'legacy-kid-url',
    })
  })

  test('Swap unknown standby key', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/186e5fae-7b67-4939-b425-bbd649844163/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: 'Standby jwk not found' })
  })

  test('Swap standby key with a malformed (non-uuid) kid is rejected', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby/fake-nonsense_186e5fae-7b67-4939-b425-bbd649844163/swap`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('getPublicJwks returns only the public component of asymmetric keys and excludes symmetric keys', async () => {
    const configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    await expect(configAwaiter).resolves.toBe(tenantId)

    await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.length === 2,
      `tenant ${tenantId} JWKS to include the ES256 standby key`
    )

    const publicJwks = await getPublicJwks(tenantId)
    expect(publicJwks).toHaveLength(1)
    expect(publicJwks[0]).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256' })
    expect(publicJwks[0]).not.toHaveProperty('d')
    expect(publicJwks[0]).not.toHaveProperty('k')
  })

  test('getPublicJwks skips a jwk with an unrecognized kty without throwing', async () => {
    let configAwaiter = createJwkConfigChangeAwaiter(
      pubSub,
      tenantId,
      TENANT_CACHE_AWAITER_TIMEOUT_MS
    )
    await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    await expect(configAwaiter).resolves.toBe(tenantId)

    configAwaiter = createJwkConfigChangeAwaiter(pubSub, tenantId, TENANT_CACHE_AWAITER_TIMEOUT_MS)
    await jwksManager.addJwk(tenantId, { kty: 'weird-legacy-kty' }, 'legacy-junk')
    await expect(configAwaiter).resolves.toBe(tenantId)

    await waitForEventually(
      () => jwksManager.getJwksTenantConfig(tenantId),
      (value) => value.keys.length === 3,
      `tenant ${tenantId} JWKS to include the ES256 standby and legacy-junk keys`
    )

    const publicJwks = await getPublicJwks(tenantId)
    expect(publicJwks).toHaveLength(1)
    expect(publicJwks[0]).toMatchObject({ kty: 'EC' })
    expect(publicJwks.some((jwk) => (jwk.kty as string) === 'weird-legacy-kty')).toBe(false)
  })
})
