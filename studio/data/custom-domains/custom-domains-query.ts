import { QueryKey, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { customDomainKeys } from './keys'

export type CustomDomainsVariables = {
  projectRef?: string
}

export async function getCustomDomains(
  { projectRef }: CustomDomainsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()

  const response = await post(
    `${API_URL}/pg-meta/${projectRef}/query`,
    { query: '' },
    { headers: Object.fromEntries(headers), signal }
  )
  if (response.error) {
    throw response.error
  }

  return { result: response }
}

export type CustomDomainsData = Awaited<ReturnType<typeof getCustomDomains>>
export type CustomDomainsError = unknown

export const useCustomDomainsQuery = <TData = CustomDomainsData>(
  { projectRef }: CustomDomainsVariables,
  { enabled = true, ...options }: UseQueryOptions<CustomDomainsData, CustomDomainsError, TData> = {}
) =>
  useQuery<CustomDomainsData, CustomDomainsError, TData>(
    customDomainKeys.list(projectRef),
    ({ signal }) => getCustomDomains({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useCustomDomainsPrefetch = ({ projectRef }: CustomDomainsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(customDomainKeys.list(projectRef), ({ signal }) =>
        getCustomDomains({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
