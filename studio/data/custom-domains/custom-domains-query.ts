import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
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

  const response = await get(
    `${process.env.NEXT_PUBLIC_API_ADMIN_URL}/projects/${projectRef}/custom-hostname`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return { customDomains: response }
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
