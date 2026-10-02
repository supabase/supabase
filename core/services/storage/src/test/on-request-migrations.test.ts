const previousEnv = vi.hoisted(() => {
  const values = {
    isMultitenant: process.env.IS_MULTITENANT,
    multiTenant: process.env.MULTI_TENANT,
    requestXForwardedHostRegExp: process.env.REQUEST_X_FORWARDED_HOST_REGEXP,
  }

  process.env.IS_MULTITENANT = 'true'
  process.env.MULTI_TENANT = 'true'
  process.env.REQUEST_X_FORWARDED_HOST_REGEXP = '^([a-z]{20})\\.local\\.test$'

  return values
})

import { signJWT } from '@internal/auth'
import { closeMultitenantPg, deleteTenantConfig, TenantMigrationStatus } from '@internal/database'
import {
  runMultitenantMigrations,
  updateTenantMigrationsState,
} from '@internal/database/migrations'
import type { FastifyInstance } from 'fastify'
import { getConfig, MultitenantMigrationStrategy, mergeConfig } from '../config'
import { adminApp } from './common'

const tenantId = 'migrationsnapshotfix'
const forwardedHost = `${tenantId}.local.test`
const adminHeaders = { apikey: process.env.ADMIN_API_KEYS }

let appInstance: FastifyInstance
let serviceKey: string

beforeAll(async () => {
  const config = getConfig({ reload: true })
  mergeConfig({
    isMultitenant: true,
    dbMigrationStrategy: MultitenantMigrationStrategy.ON_REQUEST,
    requestXForwardedHostRegExp: '^([a-z]{20})\\.local\\.test$',
  })

  await runMultitenantMigrations()
  await adminApp.inject({
    method: 'DELETE',
    url: `/tenants/${tenantId}`,
    headers: adminHeaders,
  })

  const jwtSecret = 'on-request-migration-secret'
  serviceKey = await signJWT({ role: 'service_role' }, jwtSecret, 100)
  const anonKey = await signJWT({ role: 'anon' }, jwtSecret, 100)

  const createResponse = await adminApp.inject({
    method: 'POST',
    url: `/tenants/${tenantId}`,
    headers: adminHeaders,
    payload: {
      anonKey,
      databaseUrl: config.databaseURL,
      jwtSecret,
      serviceKey,
    },
  })
  expect(createResponse.statusCode).toBe(201)

  await updateTenantMigrationsState(tenantId, {
    migration: 'initialmigration',
    state: TenantMigrationStatus.COMPLETED,
  })
  deleteTenantConfig(tenantId)

  appInstance = (await import('../app')).default()
})

afterAll(async () => {
  await appInstance?.close()
  await adminApp.inject({
    method: 'DELETE',
    url: `/tenants/${tenantId}`,
    headers: adminHeaders,
  })
  await adminApp.close()
  await closeMultitenantPg()

  restoreEnv('IS_MULTITENANT', previousEnv.isMultitenant)
  restoreEnv('MULTI_TENANT', previousEnv.multiTenant)
  restoreEnv('REQUEST_X_FORWARDED_HOST_REGEXP', previousEnv.requestXForwardedHostRegExp)
})

test('list-v2 sees migrations completed by the current request', async () => {
  const response = await appInstance.inject({
    method: 'POST',
    url: '/object/list-v2/bucket2',
    headers: {
      authorization: `Bearer ${serviceKey}`,
      'x-forwarded-host': forwardedHost,
    },
    payload: { limit: 1 },
  })

  expect(response.statusCode).toBe(200)
})

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}
