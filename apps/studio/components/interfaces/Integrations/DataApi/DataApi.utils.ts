import type { ProjectSettings } from '@/data/config/project-settings-v2-query'
import type { CustomDomainsData } from '@/data/custom-domains/custom-domains-query'
import type { ProjectJsonSchemaPaths } from '@/data/docs/project-json-schema-query'
import type { LoadBalancer } from '@/data/read-replicas/load-balancers-query'
import type { Database } from '@/data/read-replicas/replicas-query'
import { snakeToCamel } from '@/lib/helpers'

/**
 * Resolves the primary project API endpoint, respecting custom domains.
 */
export function getProjectApiEndpoint({
  settings,
  customDomainData,
}: {
  settings: ProjectSettings | undefined
  customDomainData: CustomDomainsData | undefined
}): string {
  if (customDomainData?.customDomain?.status === 'active') {
    return `https://${customDomainData.customDomain.hostname}`
  }

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  return `${protocol}://${endpoint ?? '-'}`
}

/**
 * Resolves the API endpoint URL based on the selected database, custom domain
 * status, and load balancer configuration.
 */
export function getApiEndpoint({
  selectedDatabaseId,
  projectRef,
  customDomainData,
  loadBalancers,
  selectedDatabase,
}: {
  selectedDatabaseId: string | undefined
  projectRef: string | undefined
  customDomainData: CustomDomainsData | undefined
  loadBalancers: Array<LoadBalancer> | undefined
  selectedDatabase: Database | undefined
}): string {
  const isCustomDomainActive = customDomainData?.customDomain?.status === 'active'
  const loadBalancerSelected = selectedDatabaseId === 'load-balancer'

  if (isCustomDomainActive && selectedDatabaseId === projectRef) {
    return `https://${customDomainData.customDomain.hostname}`
  }

  if (loadBalancerSelected) {
    return loadBalancers?.[0]?.endpoint ?? ''
  }

  return selectedDatabase?.restUrl ?? ''
}

export type EnrichedEntity = { id: string; displayName: string; camelCase: string }
export type EntityMap = Record<string, EnrichedEntity>

/**
 * Partitions JSON schema paths into resource and RPC entity maps.
 */
export function buildEntityMaps(paths: ProjectJsonSchemaPaths | undefined): {
  resources: EntityMap
  rpcs: EntityMap
} {
  const RPC_PREFIX = 'rpc/'

  return Object.keys(paths ?? {}).reduce<{ resources: EntityMap; rpcs: EntityMap }>(
    (acc, name) => {
      const trimmedName = name.slice(1)
      if (!trimmedName.length) return acc

      const isRpc = trimmedName.startsWith(RPC_PREFIX)
      const id = isRpc ? trimmedName.slice(RPC_PREFIX.length) : trimmedName
      const enriched: EnrichedEntity = {
        id,
        displayName: id.replace(/_/g, ' '),
        camelCase: snakeToCamel(id),
      }

      if (isRpc) {
        acc.rpcs[id] = enriched
      } else {
        acc.resources[id] = enriched
      }

      return acc
    },
    { resources: {}, rpcs: {} }
  )
}
