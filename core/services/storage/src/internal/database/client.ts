import { Cluster } from '@internal/cluster'
import { ERRORS } from '@internal/errors'
import { getXForwardedHostRegExp } from '@internal/http/x-forwarded-host'
import { getConfig } from '../../config'
import { PgTenantConnection } from './pg-connection'
import { User } from './pool'
import { getTenantConfig } from './tenant'

const xForwardedHostRegExp = getXForwardedHostRegExp()

interface ConnectionOptions {
  host: string
  tenantId: string
  headers?: Record<string, string | undefined | string[]>
  method?: string
  path?: string
  user: User
  superUser: User
  disableHostCheck?: boolean
  operation?: () => string | undefined
}

export async function getPgPostgresConnection(
  options: ConnectionOptions
): Promise<PgTenantConnection> {
  const dbCredentials = await getDbSettings(options.tenantId, options.host, {
    disableHostCheck: options.disableHostCheck,
  })

  return PgTenantConnection.create({
    ...dbCredentials,
    ...options,
    clusterSize: Cluster.size,
  })
}

export const getPostgresConnection = getPgPostgresConnection

async function getDbSettings(
  tenantId: string,
  host: string | undefined,
  options?: { disableHostCheck?: boolean }
) {
  const { isMultitenant, databasePoolURL, databaseURL, databaseMaxConnections } = getConfig()

  let dbUrl = databasePoolURL || databaseURL
  let maxConnections = databaseMaxConnections
  let isExternalPool = Boolean(databasePoolURL)

  if (isMultitenant) {
    if (!tenantId) {
      throw ERRORS.InvalidTenantId()
    }

    if (!options?.disableHostCheck) {
      if (xForwardedHostRegExp) {
        const xForwardedHost = host

        if (typeof xForwardedHost !== 'string') {
          throw ERRORS.InvalidXForwardedHeader('X-Forwarded-Host header is not a string')
        }
        if (!xForwardedHostRegExp.test(xForwardedHost)) {
          throw ERRORS.InvalidXForwardedHeader(
            'X-Forwarded-Host header does not match regular expression'
          )
        }
      }
    }

    const tenant = await getTenantConfig(tenantId)
    dbUrl = tenant.databasePoolUrl || tenant.databaseUrl
    isExternalPool = Boolean(tenant.databasePoolUrl)
    maxConnections = tenant.maxConnections ?? maxConnections
  }

  return {
    dbUrl,
    isExternalPool,
    maxConnections,
  }
}
