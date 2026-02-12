import type { CustomDomainsData } from '@/data/custom-domains/custom-domains-query'
import type { LoadBalancer } from '@/data/read-replicas/load-balancers-query'
import type { Database } from '@/data/read-replicas/replicas-query'

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
