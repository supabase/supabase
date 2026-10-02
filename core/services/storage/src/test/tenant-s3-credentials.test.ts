vi.hoisted(() => {
  process.env.PG_QUEUE_ENABLE = 'true'
  process.env.MULTI_TENANT = 'true'
  process.env.IS_MULTITENANT = 'true'
})

import { getConfig, mergeConfig } from '../config'

const { multitenantDatabaseUrl } = getConfig()
mergeConfig({
  pgQueueEnable: true,
  isMultitenant: true,
})

import { encrypt, signJWT } from '@internal/auth'
import { TENANT_S3_CREDENTIALS_CACHE_NAME } from '@internal/cache'
import {
  closeMultitenantPg,
  listenForTenantUpdate,
  multitenantPgExecutor,
  s3CredentialsManager,
} from '@internal/database'
import * as metrics from '@internal/monitoring/metrics'
import { PostgresPubSub } from '@internal/pubsub'
import dotenv from 'dotenv'
import * as migrate from '../internal/database/migrations/migrate'
import { adminApp } from './common'
import { assertLogicalLookupMetrics, getCacheRequestCalls } from './utils/cache-metrics'

dotenv.config({ path: '.env.test' })

const tenantId = 'abc123s3'

const pubSub = new PostgresPubSub(multitenantDatabaseUrl!)

// returns a promise that resolves the next time the jwk cache is invalidated
function createS3CredentialsChangeAwaiter(): Promise<string> {
  return new Promise<string>((resolve) => {
    pubSub.subscriber.notifications.once('tenants_s3_credentials_update', resolve)
  })
}

beforeAll(async () => {
  await migrate.runMultitenantMigrations()
  await pubSub.start()
  await listenForTenantUpdate(pubSub)
  vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()
})

beforeEach(async () => {
  const jwtSecret = 'zzzzzzzzzzz-s3'
  const serviceKey = await signJWT({}, jwtSecret, 100)
  await adminApp.inject({
    method: 'POST',
    url: `/tenants/${tenantId}`,
    payload: {
      anonKey: 'aaaaaaa',
      databaseUrl: 'bbbbbbb',
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
  vi.doUnmock('@internal/cache')
})

afterAll(async () => {
  await adminApp.close()
  await pubSub.close()
  await closeMultitenantPg()
})

describe('Tenant S3 credentials', () => {
  test('Add s3 credential without description', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/s3/${tenantId}/credentials`,
      payload: {},
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(400)
  })

  test('Add s3 credential without claim', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/s3/${tenantId}/credentials`,
      payload: { description: 'blah blah blah' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(201)
    const createJson = await response.json()
    expect(Object.keys(createJson)).toHaveLength(4)
    expect(createJson.id).toBeTruthy()
    expect(createJson.description).toBeTruthy()
    expect(createJson.access_key).toBeTruthy()
    expect(createJson.secret_key).toBeTruthy()

    // check that item was added
    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/s3/${tenantId}/credentials`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    const getJson = await getResponse.json()
    expect(getJson).toHaveLength(1)
    expect(Object.keys(getJson[0])).toHaveLength(4)
    expect(getJson[0]).toMatchObject({
      id: createJson.id,
      description: createJson.description,
      access_key: createJson.access_key,
      created_at: expect.any(String),
    })
  })

  test('Add more than max allowed credentials', async () => {
    for (let i = 0; i < 50; i++) {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/s3/${tenantId}/credentials`,
        payload: { description: 'blah blah blah' + i },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(201)
    }
    const responseFailure = await adminApp.inject({
      method: 'POST',
      url: `/s3/${tenantId}/credentials`,
      payload: { description: 'one too many' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(responseFailure.statusCode).toBe(400)
  })

  test('Add s3 credential with claim', async () => {
    const getByKeySpy = vi.spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
    try {
      const claimKept = {
        some: 'other',
        stuff: 'here',
        role: 'king of the world',
        sub: 'marine',
      }
      const claimRemoved = {
        iss: 'abc',
        exp: 54321,
        iat: 12345,
      }
      const claims = {
        issuer: 'def',
        ...claimRemoved,
        ...claimKept,
      }
      const response = await adminApp.inject({
        method: 'POST',
        url: `/s3/${tenantId}/credentials`,
        payload: { description: 'blah blah blah', claims },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(201)
      const createJson = await response.json()
      expect(Object.keys(createJson)).toHaveLength(4)
      expect(createJson.id).toBeTruthy()
      expect(createJson.description).toBeTruthy()
      expect(createJson.access_key).toBeTruthy()
      expect(createJson.secret_key).toBeTruthy()

      // check that the claims were stored correctly
      const keyResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      // ensure it was loaded from the database
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(keyResult).toMatchObject({
        accessKey: createJson.access_key,
        secretKey: createJson.secret_key,
        claims: {
          issuer: `supabase.storage.${tenantId}`,
          ...claimKept,
        },
      })
      Object.keys(claimRemoved).forEach((k) => expect(k in keyResult.claims).toBe(false))

      // load again and ensure it was loaded from cache and not the database
      const cacheResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(cacheResult).toMatchObject(keyResult)
    } finally {
      getByKeySpy.mockRestore()
    }
  })

  test('Delete s3 credential with missing payload', async () => {
    const deleteResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/s3/${tenantId}/credentials`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteResponse.statusCode).toBe(400)
  })

  test('Delete s3 credential with invalid id', async () => {
    const deleteResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/s3/${tenantId}/credentials`,
      payload: { id: 'abc123' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteResponse.statusCode).toBe(400)
  })

  test('Delete s3 credential with not found id', async () => {
    const deleteResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/s3/${tenantId}/credentials`,
      payload: { id: '59e0ddab-3e41-451c-bc42-f8bb1387381d' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteResponse.statusCode).toBe(204)
  })

  test('Delete s3 credential', async () => {
    const response = await adminApp.inject({
      method: 'POST',
      url: `/s3/${tenantId}/credentials`,
      payload: { description: 'blah blah blah' },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(response.statusCode).toBe(201)
    const createJson = await response.json()
    expect(Object.keys(createJson)).toHaveLength(4)
    expect(createJson.id).toBeTruthy()
    expect(createJson.description).toBeTruthy()
    expect(createJson.access_key).toBeTruthy()
    expect(createJson.secret_key).toBeTruthy()

    // check that item was added
    const getResponse = await adminApp.inject({
      method: 'GET',
      url: `/s3/${tenantId}/credentials`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse.statusCode).toBe(200)
    const getJson = await getResponse.json()
    expect(getJson).toHaveLength(1)
    expect(Object.keys(getJson[0])).toHaveLength(4)
    expect(getJson[0]).toMatchObject({
      id: createJson.id,
      description: createJson.description,
      access_key: createJson.access_key,
      created_at: expect.any(String),
    })

    // delete item
    const deleteResponse = await adminApp.inject({
      method: 'DELETE',
      url: `/s3/${tenantId}/credentials`,
      payload: { id: createJson.id },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(deleteResponse.statusCode).toBe(204)

    // check that item was deleted
    const getResponse2 = await adminApp.inject({
      method: 'GET',
      url: `/s3/${tenantId}/credentials`,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(getResponse2.statusCode).toBe(200)
    const getJson2 = await getResponse2.json()
    expect(getJson2).toHaveLength(0)
  })

  test('Config always retrieves concurrent requests from cache', async () => {
    const getByKeySpy = vi.spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/s3/${tenantId}/credentials`,
        payload: { description: 'blah blah blah' },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(201)
      const createJson = await response.json()

      const results = await Promise.all([
        s3CredentialsManager.getS3CredentialsByAccessKey(tenantId, createJson.access_key),
        s3CredentialsManager.getS3CredentialsByAccessKey(tenantId, createJson.access_key),
        s3CredentialsManager.getS3CredentialsByAccessKey(tenantId, createJson.access_key),
      ])
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      results.forEach((result, i) => expect(result).toEqual(results[i === 0 ? 1 : 0]))
      expect(results[0].accessKey).toBe(createJson.access_key)
    } finally {
      getByKeySpy.mockRestore()
    }
  })

  test('S3 credential invalidation cannot be undone by an older in-flight load', async () => {
    const lookupTenantId = 's3-invalidation-during-load'
    const accessKey = 'invalidation-access-key'
    const cacheKey = `${lookupTenantId}:${accessKey}`
    const claims = { role: 'service_role' }
    const staleCredentials = {
      accessKey,
      secretKey: encrypt('stale-secret'),
      claims,
    }
    const freshCredentials = {
      accessKey,
      secretKey: encrypt('fresh-secret'),
      claims,
    }
    const staleRequest = Promise.withResolvers<typeof staleCredentials>()
    const getByKeySpy = vi
      .spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
      .mockReturnValueOnce(staleRequest.promise)
      .mockResolvedValueOnce(freshCredentials)
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')

    try {
      recordSpy.mockClear()
      const staleLookup = s3CredentialsManager.getS3CredentialsByAccessKey(
        lookupTenantId,
        accessKey
      )
      await vi.waitFor(() => expect(getByKeySpy).toHaveBeenCalledTimes(1))

      pubSub.subscriber.notifications.emit('tenants_s3_credentials_update', cacheKey)

      await expect(staleLookup).resolves.toMatchObject({ secretKey: 'fresh-secret' })
      expect(getByKeySpy).toHaveBeenCalledTimes(2)
      expect(getCacheRequestCalls(recordSpy, TENANT_S3_CREDENTIALS_CACHE_NAME)).toEqual([
        [TENANT_S3_CREDENTIALS_CACHE_NAME, 'miss'],
      ])

      staleRequest.resolve(staleCredentials)
      await new Promise<void>((resolve) => setImmediate(resolve))

      await expect(
        s3CredentialsManager.getS3CredentialsByAccessKey(lookupTenantId, accessKey)
      ).resolves.toMatchObject({ secretKey: 'fresh-secret' })
      expect(getCacheRequestCalls(recordSpy, TENANT_S3_CREDENTIALS_CACHE_NAME)).toEqual([
        [TENANT_S3_CREDENTIALS_CACHE_NAME, 'miss'],
        [TENANT_S3_CREDENTIALS_CACHE_NAME, 'hit'],
      ])
    } finally {
      pubSub.subscriber.notifications.emit('tenants_s3_credentials_update', cacheKey)
      getByKeySpy.mockRestore()
      recordSpy.mockRestore()
    }
  })

  test('S3 credential invalidation retries an older in-flight load that fails', async () => {
    const lookupTenantId = 's3-invalidation-error'
    const accessKey = 'invalidation-error-access-key'
    const cacheKey = `${lookupTenantId}:${accessKey}`
    const freshCredentials = {
      accessKey,
      secretKey: encrypt('fresh-secret'),
      claims: { role: 'service_role' },
    }
    const staleRequest = Promise.withResolvers<never>()
    const getByKeySpy = vi
      .spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
      .mockReturnValueOnce(staleRequest.promise)
      .mockResolvedValueOnce(freshCredentials)

    try {
      const staleLookup = s3CredentialsManager.getS3CredentialsByAccessKey(
        lookupTenantId,
        accessKey
      )
      await vi.waitFor(() => expect(getByKeySpy).toHaveBeenCalledTimes(1))

      pubSub.subscriber.notifications.emit('tenants_s3_credentials_update', cacheKey)
      const freshLookup = s3CredentialsManager.getS3CredentialsByAccessKey(
        lookupTenantId,
        accessKey
      )
      staleRequest.reject(new Error('detached S3 credential load failed'))

      await expect(Promise.all([staleLookup, freshLookup])).resolves.toEqual([
        expect.objectContaining({ secretKey: 'fresh-secret' }),
        expect.objectContaining({ secretKey: 'fresh-secret' }),
      ])
      expect(getByKeySpy).toHaveBeenCalledTimes(2)
    } finally {
      pubSub.subscriber.notifications.emit('tenants_s3_credentials_update', cacheKey)
      getByKeySpy.mockRestore()
    }
  })

  test('Ensure cache is cleared on delete', async () => {
    const getByKeySpy = vi.spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
    const claims = {
      issuer: `supabase.storage.${tenantId}`,
      role: 'service_role',
    }
    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/s3/${tenantId}/credentials`,
        payload: { description: 'blah blah blah' },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(201)
      const createJson = await response.json()

      // check that the claims were stored correctly
      const keyResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      // ensure it was loaded from the database
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(keyResult).toEqual({
        accessKey: createJson.access_key,
        secretKey: createJson.secret_key,
        claims,
      })

      // load again and ensure it was loaded from cache and not the database
      const cacheResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(cacheResult).toEqual(keyResult)

      const configAwaiter = createS3CredentialsChangeAwaiter()

      // delete item
      const deleteResponse = await adminApp.inject({
        method: 'DELETE',
        url: `/s3/${tenantId}/credentials`,
        payload: { id: createJson.id },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(deleteResponse.statusCode).toBe(204)

      const cacheKey = await configAwaiter
      expect(cacheKey).toBe(tenantId + ':' + cacheResult.accessKey)

      // if cache is updated this should throw because it doesn't exist
      await expect(
        s3CredentialsManager.getS3CredentialsByAccessKey(tenantId, createJson.access_key)
      ).rejects.toThrow('The Access Key Id you provided does not exist in our records.')
      expect(getByKeySpy).toHaveBeenCalledTimes(2)
    } finally {
      getByKeySpy.mockRestore()
    }
  })

  test('Ensure cache is cleared on update', async () => {
    const getByKeySpy = vi.spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
    const claims = {
      issuer: `supabase.storage.${tenantId}`,
      role: 'service_role',
    }
    try {
      const response = await adminApp.inject({
        method: 'POST',
        url: `/s3/${tenantId}/credentials`,
        payload: { description: 'blah blah blah' },
        headers: {
          apikey: process.env.ADMIN_API_KEYS,
        },
      })
      expect(response.statusCode).toBe(201)
      const createJson = await response.json()

      // check that the claims were stored correctly
      const keyResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      // ensure it was loaded from the database
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(keyResult).toEqual({
        accessKey: createJson.access_key,
        secretKey: createJson.secret_key,
        claims,
      })

      // load again and ensure it was loaded from cache and not the database
      const cacheResult = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      expect(getByKeySpy).toHaveBeenCalledTimes(1)
      expect(cacheResult).toEqual(keyResult)

      const configAwaiter = createS3CredentialsChangeAwaiter()

      // update item
      const secretKey = 'zzzzzzzzzzzzzzzzz'
      await multitenantPgExecutor.query({
        text: `
          UPDATE tenants_s3_credentials
          SET secret_key = $1
          WHERE id = $2
        `,
        values: [encrypt(secretKey), createJson.id],
      })

      const cacheKey = await configAwaiter
      expect(cacheKey).toBe(tenantId + ':' + cacheResult.accessKey)

      // load again and ensure it was loaded from cache and not the database
      const cacheResult2 = await s3CredentialsManager.getS3CredentialsByAccessKey(
        tenantId,
        createJson.access_key
      )
      expect(getByKeySpy).toHaveBeenCalledTimes(2)
      expect(cacheResult2).toEqual({ ...keyResult, secretKey })
    } finally {
      getByKeySpy.mockRestore()
    }
  })

  test('Config records one cache request per logical lookup', async () => {
    const getByKeySpy = vi.spyOn(s3CredentialsManager['storage'], 'getOneByAccessKey')
    const recordSpy = vi.spyOn(metrics, 'recordCacheRequest')
    const lookupTenantId = 's3-cache-metrics-lookup'
    const lookupAccessKey = 's3-cache-metrics-access-key'
    const credentials = {
      accessKey: lookupAccessKey,
      secretKey: encrypt('metric-secret'),
      claims: {
        issuer: `supabase.storage.${lookupTenantId}`,
        role: 'service_role',
      },
    }

    const credentialsLookup = Promise.withResolvers<typeof credentials>()

    try {
      getByKeySpy.mockImplementation(() => credentialsLookup.promise)

      await assertLogicalLookupMetrics({
        recordSpy,
        backendCallSpy: getByKeySpy,
        cacheName: TENANT_S3_CREDENTIALS_CACHE_NAME,
        startLookups: () => [
          s3CredentialsManager.getS3CredentialsByAccessKey(lookupTenantId, lookupAccessKey),
          s3CredentialsManager.getS3CredentialsByAccessKey(lookupTenantId, lookupAccessKey),
          s3CredentialsManager.getS3CredentialsByAccessKey(lookupTenantId, lookupAccessKey),
        ],
        resolveBackend: () => credentialsLookup.resolve(credentials),
        assertCachedHit: async () => {
          await expect(
            s3CredentialsManager.getS3CredentialsByAccessKey(lookupTenantId, lookupAccessKey)
          ).resolves.toMatchObject({
            accessKey: lookupAccessKey,
            secretKey: 'metric-secret',
          })
        },
      })
    } finally {
      getByKeySpy.mockRestore()
      recordSpy.mockRestore()
    }
  })
})
