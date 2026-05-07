import { describe, expect, it } from 'vitest'

import { buildEntityMaps, getApiEndpoint } from './DataApi.utils'
import type { ProjectJsonSchemaPaths } from '@/data/docs/project-json-schema-query'
import type { LoadBalancer } from '@/data/read-replicas/load-balancers-query'
import type { Database } from '@/data/read-replicas/replicas-query'

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
        resolvedEndpoint: 'https://api.example.com',
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
        resolvedEndpoint: 'https://api.example.com',
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
        resolvedEndpoint: 'https://project-ref.supabase.co',
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
        resolvedEndpoint: 'https://project-ref.supabase.co',
        loadBalancers: undefined,
        selectedDatabase: undefined,
      })
    ).toBe('')
  })

  it('returns database restUrl for a replica database selection', () => {
    expect(
      getApiEndpoint({
        selectedDatabaseId: 'replica-2',
        projectRef: 'project-ref',
        resolvedEndpoint: 'https://project-ref.supabase.co',
        loadBalancers: undefined,
        selectedDatabase: makeDatabase(
          'replica-2',
          'https://replica-2.supabase.co/rest/v1'
        ) as Database,
      })
    ).toBe('https://replica-2.supabase.co/rest/v1')
  })
})

describe('buildEntityMaps', () => {
  it('returns empty maps for undefined paths', () => {
    expect(buildEntityMaps(undefined)).toEqual({ resources: {}, rpcs: {} })
  })

  it('returns empty maps for empty paths', () => {
    expect(buildEntityMaps({})).toEqual({ resources: {}, rpcs: {} })
  })

  it('skips the root path', () => {
    const paths: ProjectJsonSchemaPaths = {
      '/': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
    }
    expect(buildEntityMaps(paths)).toEqual({ resources: {}, rpcs: {} })
  })

  it('classifies non-rpc paths as resources', () => {
    const paths: ProjectJsonSchemaPaths = {
      '/users': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
      '/posts': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
    }
    const result = buildEntityMaps(paths)
    expect(Object.keys(result.resources)).toEqual(['users', 'posts'])
    expect(result.rpcs).toEqual({})
  })

  it('classifies rpc/ paths as rpcs', () => {
    const paths: ProjectJsonSchemaPaths = {
      '/rpc/my_function': { post: {} as ProjectJsonSchemaPaths[string]['post'] },
    }
    const result = buildEntityMaps(paths)
    expect(result.resources).toEqual({})
    expect(Object.keys(result.rpcs)).toEqual(['my_function'])
  })

  it('enriches entities with displayName and camelCase', () => {
    const paths: ProjectJsonSchemaPaths = {
      '/user_profiles': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
      '/rpc/get_user_count': { post: {} as ProjectJsonSchemaPaths[string]['post'] },
    }
    const result = buildEntityMaps(paths)

    expect(result.resources['user_profiles']).toEqual({
      id: 'user_profiles',
      displayName: 'user profiles',
      camelCase: 'userProfiles',
    })
    expect(result.rpcs['get_user_count']).toEqual({
      id: 'get_user_count',
      displayName: 'get user count',
      camelCase: 'getUserCount',
    })
  })

  it('handles mixed resources and rpcs', () => {
    const paths: ProjectJsonSchemaPaths = {
      '/': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
      '/users': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
      '/rpc/hello': { post: {} as ProjectJsonSchemaPaths[string]['post'] },
      '/posts': { get: {} as ProjectJsonSchemaPaths[string]['get'] },
      '/rpc/goodbye': { post: {} as ProjectJsonSchemaPaths[string]['post'] },
    }
    const result = buildEntityMaps(paths)
    expect(Object.keys(result.resources)).toEqual(['users', 'posts'])
    expect(Object.keys(result.rpcs)).toEqual(['hello', 'goodbye'])
  })
})
