vi.hoisted(() => {
  process.env.MULTI_TENANT = 'true'
  process.env.IS_MULTITENANT = 'true'
  process.env.REQUEST_X_FORWARDED_HOST_REGEXP = '^([a-z]{20})\\.supabase\\.(?:co|in|net)$'
})

import { signJWT } from '@internal/auth'
import { StoragePgDB } from '@storage/database'
import { getConfig, mergeConfig } from '../config'
import * as tenant from '../internal/database/tenant'
import { adminApp } from './common'

vi.spyOn(tenant, 'getTenantConfig').mockImplementation(async () => ({
  anonKey: process.env.ANON_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
  serviceKey: process.env.SERVICE_KEY || '',
  serviceKeyPayload: {
    alg: 'HS256',
    typ: 'JWT',
    role: 'service_role',
    iat: 1613531985,
    exp: 1929107985,
  },
  jwtSecret: process.env.PGRST_JWT_SECRET || '',
  fileSizeLimit: parseInt(process.env.FILE_SIZE_LIMIT || '1000'),
  features: {
    imageTransformation: {
      enabled: true,
    },
    s3Protocol: {
      enabled: true,
    },
    purgeCache: {
      enabled: true,
    },
    icebergCatalog: {
      enabled: true,
      maxCatalogs: 10,
      maxNamespaces: 30,
      maxTables: 20,
    },
    vectorBuckets: {
      enabled: true,
      maxBuckets: 5,
      maxIndexes: 10,
    },
  },
}))

// Mock module with inline implementation that doesn't depend on variables
vi.mock('@storage/database', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@storage/database')>()),
  StoragePgDB: vi.fn(function () {
    return {
      listBuckets: vi.fn().mockResolvedValue([{ id: 'abc123', name: 'def456' }]),
    }
  }),
}))

const storageDbMock = vi.mocked(StoragePgDB)
const fallbackTenantId = `x-forwarded-default-${Date.now()}`
const fallbackTenantJwtSecret = 'fallback-jwt-secret'
let fallbackAuthenticatedJwt = ''

getConfig()
mergeConfig({
  isMultitenant: true,
  tenantId: fallbackTenantId,
  requestXForwardedHostRegExp: '^([a-z]{20})\\.supabase\\.(?:co|in|net)$',
})

import { closeMultitenantPg } from '../internal/database'
import * as migrate from '../internal/database/migrations/migrate'

let appInstance: import('fastify').FastifyInstance
let buildApp: typeof import('../app').default

beforeAll(async () => {
  await migrate.runMultitenantMigrations()
  vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()

  vi.spyOn(tenant, 'getServiceKey').mockResolvedValue(process.env.SERVICE_KEY || '')

  buildApp = (await import('../app')).default

  const fallbackTenantCreateResponse = await adminApp.inject({
    method: 'POST',
    url: `/tenants/` + fallbackTenantId,
    payload: {
      anonKey: 'fallback-anon',
      databaseUrl: 'fallback-db',
      jwtSecret: fallbackTenantJwtSecret,
      serviceKey: 'fallback-service',
    },
    headers: {
      apikey: process.env.ADMIN_API_KEYS,
    },
  })
  expect(fallbackTenantCreateResponse.statusCode).toBe(201)

  fallbackAuthenticatedJwt = await signJWT(
    { role: 'authenticated', sub: 'user-id' },
    fallbackTenantJwtSecret,
    100
  )
})

beforeEach(() => {
  mergeConfig({
    isMultitenant: true,
    requestXForwardedHostRegExp: '^([a-z]{20})\\.supabase\\.(?:co|in|net)$',
  })
  appInstance = buildApp()
})

afterEach(async () => {
  await appInstance.close()
})

afterAll(async () => {
  await adminApp.inject({
    method: 'DELETE',
    url: '/tenants/' + fallbackTenantId,
    headers: {
      apikey: process.env.ADMIN_API_KEYS,
    },
  })
  await adminApp.close()
  await closeMultitenantPg()
  vi.restoreAllMocks()
})

describe('with X-Forwarded-Host header', () => {
  test('PostgREST URL is constructed using X-Forwarded-Host if regexp matches', async () => {
    const tenantId = 'abcdefghijklmnzzzzzz'
    const host = tenantId + '.supabase.co'

    await adminApp.inject({
      method: 'DELETE',
      url: '/tenants/' + tenantId,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    const tenantCreateResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/` + tenantId,
      payload: {
        anonKey: 'a',
        databaseUrl: 'b',
        jwtSecret: 'c',
        serviceKey: 'd',
      },
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })
    expect(tenantCreateResponse.statusCode).toBe(201)

    const authenticatedJwt = await signJWT({ role: 'authenticated', sub: 'user-id' }, 'c', 100)

    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${authenticatedJwt}`,
        'x-forwarded-host': host,
      },
    })
    expect(response.statusCode).toBe(200)

    await adminApp.inject({
      method: 'DELETE',
      url: '/tenants/' + tenantId,
      headers: {
        apikey: process.env.ADMIN_API_KEYS,
      },
    })

    // check that x-forwarded-host tenant id was passed all the way to the database correctly
    expect(storageDbMock).toHaveBeenCalledTimes(1)

    const [tenantConnectionArgs, tenantConnectionOptions] = storageDbMock.mock
      .calls[0] as unknown as [
      { options: { tenantId: string; host: string } },
      { tenantId: string; host: string },
    ]

    expect(tenantConnectionArgs.options.tenantId).toBe(tenantId)
    expect(tenantConnectionArgs.options.host).toBe(host)
    expect(tenantConnectionOptions.tenantId).toBe(tenantId)
    expect(tenantConnectionOptions.host).toBe(host)
  })

  test('Error is thrown if X-Forwarded-Host is not present', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${fallbackAuthenticatedJwt}`,
      },
    })
    expect(response.statusCode).toBe(400)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON.message).toBe('X-Forwarded-Host header is not a string')
  })

  test('Error is thrown if X-Forwarded-Host does not match regexp', async () => {
    const response = await appInstance.inject({
      method: 'GET',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${fallbackAuthenticatedJwt}`,
        'x-forwarded-host': 'abcdefghijklmnopqrst.supabase.com',
      },
    })
    expect(response.statusCode).toBe(400)
    const responseJSON = JSON.parse(response.body)
    expect(responseJSON.message).toBe('X-Forwarded-Host header does not match regular expression')
  })
})
