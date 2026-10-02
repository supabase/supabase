const previousEnv = vi.hoisted(() => {
  const values = {
    isMultitenant: process.env.IS_MULTITENANT,
    multiTenant: process.env.MULTI_TENANT,
  }

  process.env.MULTI_TENANT = 'false'
  process.env.IS_MULTITENANT = 'false'

  return values
})

import { PgTenantConnection } from '@internal/database'
import { runMigrationsOnTenant } from '@internal/database/migrations'
import { StoragePgDB } from '@storage/database'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import app from '../app'
import { getConfig, mergeConfig } from '../config'

getConfig({ reload: true })
mergeConfig({
  isMultitenant: false,
})

const authenticatedKey = process.env.AUTHENTICATED_KEY || ''
const serviceKey = process.env.SERVICE_KEY || ''
const { databaseURL, tenantId } = getConfig()

describe('pg storage runtime selection', () => {
  let appInstance: ReturnType<typeof app>

  beforeAll(async () => {
    await runMigrationsOnTenant({
      databaseUrl: databaseURL!,
      tenantId,
      waitForLock: true,
    })
  })

  beforeEach(() => {
    appInstance = app()
  })

  afterEach(async () => {
    await appInstance.close()
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await PgTenantConnection.stop()

    restoreEnv('IS_MULTITENANT', previousEnv.isMultitenant)
    restoreEnv('MULTI_TENANT', previousEnv.multiTenant)
    getConfig({ reload: true })
  })

  it('uses StoragePgDB for normal storage routes', async () => {
    const listBucketsSpy = vi.spyOn(StoragePgDB.prototype, 'listBuckets')

    const response = await appInstance.inject({
      method: 'GET',
      url: '/bucket',
      headers: {
        authorization: `Bearer ${authenticatedKey}`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(listBucketsSpy).toHaveBeenCalledTimes(1)
  })

  it('uses PgMetastore for Iceberg catalog routes', async () => {
    const findCatalogSpy = vi.spyOn(PgMetastore.prototype, 'findCatalogByName')

    await appInstance.inject({
      method: 'GET',
      url: '/iceberg/v1/config?warehouse=missing-pg-runtime-catalog',
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    expect(findCatalogSpy).toHaveBeenCalledTimes(1)
  })
})

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}
