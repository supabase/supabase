import type { ProjectJsonSchemaPaths } from '@/data/docs/project-json-schema-query'
import type { LoadBalancer } from '@/data/read-replicas/load-balancers-query'
import type { Database } from '@/data/read-replicas/replicas-query'
import { snakeToCamel } from '@/lib/helpers'

/**
 * Resolves the API endpoint URL based on the selected database, custom domain
 * status, and load balancer configuration. The returned URL is normalized to
 * end with `/rest/v1/` to match the Data API base path documented elsewhere.
 */
export function getApiEndpoint({
  selectedDatabaseId,
  projectRef,
  resolvedEndpoint,
  loadBalancers,
  selectedDatabase,
}: {
  selectedDatabaseId: string | undefined
  projectRef: string | undefined
  resolvedEndpoint: string | undefined
  loadBalancers: Array<LoadBalancer> | undefined
  selectedDatabase: Database | undefined
}): string {
  const loadBalancerSelected = selectedDatabaseId === 'load-balancer'

  if (selectedDatabaseId === projectRef && !!resolvedEndpoint) {
    return withDataApiPath(resolvedEndpoint)
  }

  if (loadBalancerSelected) {
    return withDataApiPath(loadBalancers?.[0]?.endpoint)
  }

  return withDataApiPath(selectedDatabase?.restUrl)
}

function withDataApiPath(url: string | undefined): string {
  if (!url) return ''
  const trimmed = url.replace(/\/+$/, '')
  return /\/rest\/v1$/.test(trimmed) ? `${trimmed}/` : `${trimmed}/rest/v1/`
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
