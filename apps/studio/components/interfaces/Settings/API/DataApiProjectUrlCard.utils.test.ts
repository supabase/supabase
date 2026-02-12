import { describe, expect, it } from 'vitest'

import { getApiEndpoint } from './DataApiProjectUrlCard.utils'
import type {
  CustomDomainResponse,
  CustomDomainsData,
} from '@/data/custom-domains/custom-domains-query'
import type { LoadBalancer } from '@/data/read-replicas/load-balancers-query'
import type { Database } from '@/data/read-replicas/replicas-query'

const makeCustomDomainData = (hostname: string): CustomDomainsData => ({
  customDomain: {
    id: '',
    ssl: {} as CustomDomainResponse['ssl'],
    hostname,
    status: 'active',
    created_at: '',
    custom_metadata: null,
    custom_origin_server: '',
  },
  status: '5_services_reconfigured',
})

const makeDatabase = (
  identifier: string,
  restUrl: string
): Pick<Database, 'identifier' | 'restUrl'> => ({ identifier, restUrl })

const makeLoadBalancer = (endpoint: string): Pick<LoadBalancer, 'endpoint'> => ({ endpoint })

describe('getApiEndpoint', () => {
  it('returns custom domain URL when custom domain is active and primary database is selected', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'project-ref',
        projectRef: 'project-ref',
        customDomainData: makeCustomDomainData('api.example.com'),
        loadBalancers: undefined,
        selectedDatabase: makeDatabase(
          'project-ref',
          'https://project-ref.supabase.co/rest/v1'
        ) as Database,
      })
    ).toBe('https://api.example.com')
  })

  it('returns database restUrl when custom domain is active but a replica is selected', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'replica-1',
        projectRef: 'project-ref',
        customDomainData: makeCustomDomainData('api.example.com'),
        loadBalancers: undefined,
        selectedDatabase: makeDatabase(
          'replica-1',
          'https://replica-1.supabase.co/rest/v1'
        ) as Database,
      })
    ).toBe('https://replica-1.supabase.co/rest/v1')
  })

  it('returns load balancer endpoint when load balancer is selected', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'load-balancer',
        projectRef: 'project-ref',
        customDomainData: undefined,
        loadBalancers: [makeLoadBalancer('https://lb.supabase.co') as LoadBalancer],
        selectedDatabase: undefined,
      })
    ).toBe('https://lb.supabase.co')
  })

  it('returns empty string when load balancer is selected but none exist', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'load-balancer',
        projectRef: 'project-ref',
        customDomainData: undefined,
        loadBalancers: undefined,
        selectedDatabase: undefined,
      })
    ).toBe('')
  })

  it('returns database restUrl for a normal database selection', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'project-ref',
        projectRef: 'project-ref',
        customDomainData: undefined,
        loadBalancers: undefined,
        selectedDatabase: makeDatabase(
          'project-ref',
          'https://project-ref.supabase.co/rest/v1'
        ) as Database,
      })
    ).toBe('https://project-ref.supabase.co/rest/v1')
  })

  it('ignores custom domain when it is not active', () => {
    const inactiveCustomDomain: CustomDomainsData = {
      customDomain: null,
      status: '0_no_hostname_configured',
    }

    expect(
      getApiEndpoint({
        selectedDatabaseId: 'project-ref',
        projectRef: 'project-ref',
        customDomainData: inactiveCustomDomain,
        loadBalancers: undefined,
        selectedDatabase: makeDatabase(
          'project-ref',
          'https://project-ref.supabase.co/rest/v1'
        ) as Database,
      })
    ).toBe('https://project-ref.supabase.co/rest/v1')
  })
})
