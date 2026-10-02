vi.hoisted(() => {
  process.env.PG_QUEUE_ENABLE = 'true'
  process.env.MULTI_TENANT = 'true'
  process.env.IS_MULTITENANT = 'true'
  process.env.REQUEST_X_FORWARDED_HOST_REGEXP = '^([a-z0-9-]+)\\.supabase\\.co$'
  process.env.AUTH_URL_SIGNING_JWK_TYPE = 'HS512'
})

import { getConfig, mergeConfig } from '../config'

const { multitenantDatabaseUrl } = getConfig()
mergeConfig({
  pgQueueEnable: true,
  isMultitenant: true,
  requestXForwardedHostRegExp: '^([a-z0-9-]+)\\.supabase\\.co$',
})

import { signJWT } from '@internal/auth'
import { closeMultitenantPg, jwksManager, listenForTenantUpdate } from '@internal/database'
import { PostgresPubSub } from '@internal/pubsub'
import dotenv from 'dotenv'
import type { FastifyInstance } from 'fastify'
import * as migrate from '../internal/database/migrations/migrate'
import { adminApp } from './common'
import { createJwkConfigChangeAwaiter } from './utils/config-change-awaiter'

dotenv.config({ path: '.env.test' })

const WELL_KNOWN_JWKS_HELPER_TIMEOUT_MS = 4000

let appInstance: FastifyInstance
let buildApp: typeof import('../app').default
const pubSub = new PostgresPubSub(multitenantDatabaseUrl!)

beforeAll(async () => {
  await migrate.runMultitenantMigrations()
  vi.spyOn(migrate, 'runMigrationsOnTenant').mockResolvedValue()
  buildApp = (await import('../app')).default
  await pubSub.start()
  await listenForTenantUpdate(pubSub)
})

beforeEach(() => {
  appInstance = buildApp()
})

afterEach(async () => {
  await appInstance.close()
})

afterAll(async () => {
  await adminApp.close()
  await pubSub.close()
  await closeMultitenantPg()
})

describe('GET /.well-known/jwks.json', () => {
  test('returns only the public component of the tenant signing key', async () => {
    const tenantId = `well-known-jwks-basic-${Date.now()}`
    const host = `${tenantId}.supabase.co`
    const jwtSecret = 'well-known-jwks-secret'
    const serviceKey = await signJWT({}, jwtSecret, 100)

    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}`,
      payload: { anonKey: 'aaaa', databaseUrl: 'bbbb', jwtSecret, serviceKey },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })
    expect(createResponse.statusCode).toBe(201)

    const standbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })
    expect(standbyResponse.statusCode).toBe(201)

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['cache-control']).toBe('public, max-age=600')
      const body = response.json<{ keys: Array<Record<string, unknown>> }>()
      expect(body.keys).toHaveLength(1)
      expect(body.keys[0]).toMatchObject({ kty: 'EC', crv: 'P-256', alg: 'ES256' })
      expect(body.keys[0]).not.toHaveProperty('d')
    } finally {
      await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}`,
        headers: { apikey: process.env.ADMIN_API_KEYS },
      })
    }
  })

  test('excludes symmetric (oct) keys from the response', async () => {
    const tenantId = `well-known-jwks-oct-${Date.now()}`
    const host = `${tenantId}.supabase.co`
    const jwtSecret = 'well-known-jwks-secret'
    const serviceKey = await signJWT({}, jwtSecret, 100)

    await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}`,
      payload: { anonKey: 'aaaa', databaseUrl: 'bbbb', jwtSecret, serviceKey },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })

    const hs512StandbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'HS512' },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })
    expect(hs512StandbyResponse.statusCode).toBe(201)

    const es256StandbyResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}/jwks/url-signing/standby`,
      payload: { type: 'ES256' },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })
    expect(es256StandbyResponse.statusCode).toBe(201)

    try {
      const response = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json<{ keys: Array<Record<string, unknown>> }>()
      expect(body.keys).toHaveLength(1)
      expect(body.keys.every((key) => key.kty !== 'oct')).toBe(true)
    } finally {
      await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}`,
        headers: { apikey: process.env.ADMIN_API_KEYS },
      })
    }
  })

  test('caches the jwks lookup and repeats the same miss-then-hit pattern after a jwks change', async () => {
    const tenantId = `well-known-jwks-cache-${Date.now()}`
    const host = `${tenantId}.supabase.co`
    const jwtSecret = 'well-known-jwks-cache-secret'
    const serviceKey = await signJWT({}, jwtSecret, 100)

    const createResponse = await adminApp.inject({
      method: 'POST',
      url: `/tenants/${tenantId}`,
      payload: { anonKey: 'aaaa', databaseUrl: 'bbbb', jwtSecret, serviceKey },
      headers: { apikey: process.env.ADMIN_API_KEYS },
    })
    expect(createResponse.statusCode).toBe(201)

    const listActiveSpy = vi.spyOn(jwksManager['storage'], 'listActive')

    try {
      const firstRead = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })
      expect(firstRead.statusCode).toBe(200)
      expect(firstRead.json()).toEqual({ keys: [] })
      expect(listActiveSpy).toHaveBeenCalledTimes(1)

      const secondRead = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })
      expect(secondRead.statusCode).toBe(200)
      expect(secondRead.json()).toEqual({ keys: [] })
      expect(listActiveSpy).toHaveBeenCalledTimes(1)

      const configChanged = createJwkConfigChangeAwaiter(
        pubSub,
        tenantId,
        WELL_KNOWN_JWKS_HELPER_TIMEOUT_MS
      )
      const standbyResponse = await adminApp.inject({
        method: 'POST',
        url: `/tenants/${tenantId}/jwks/url-signing/standby`,
        payload: { type: 'ES256' },
        headers: { apikey: process.env.ADMIN_API_KEYS },
      })
      expect(standbyResponse.statusCode).toBe(201)
      const { kid: standbyKid } = standbyResponse.json<{ kid: string }>()
      await expect(configChanged).resolves.toBe(tenantId)

      const thirdRead = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })
      expect(thirdRead.statusCode).toBe(200)
      expect(listActiveSpy).toHaveBeenCalledTimes(2)
      const thirdBody = thirdRead.json<{ keys: Array<Record<string, unknown>> }>()
      expect(thirdBody.keys).toEqual([
        {
          kty: 'EC',
          crv: 'P-256',
          x: expect.any(String),
          y: expect.any(String),
          kid: standbyKid,
          alg: 'ES256',
        },
      ])

      const fourthRead = await appInstance.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
        headers: { 'x-forwarded-host': host },
      })
      expect(fourthRead.statusCode).toBe(200)
      expect(fourthRead.json()).toEqual(thirdBody)
      expect(listActiveSpy).toHaveBeenCalledTimes(2)
    } finally {
      listActiveSpy.mockRestore()
      await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}`,
        headers: { apikey: process.env.ADMIN_API_KEYS },
      })
    }
  })
})
