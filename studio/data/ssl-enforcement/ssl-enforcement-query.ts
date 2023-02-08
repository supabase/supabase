import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { sslEnforcementKeys } from './keys'

export type SSLEnforcementVariables = { projectRef?: string }

export type SSLEnforcementResponse = {
  id: string
  error?: any
}

export async function getSSLEnforcementConfiguration(
  { projectRef }: SSLEnforcementVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = (await get(`${API_ADMIN_URL}/projects/${projectRef}/ssl-enforcement`, {
    signal,
  })) as SSLEnforcementResponse

  if (response.error) throw response.error

  return response as SSLEnforcementResponse
}

export type SSLEnforcementData = Awaited<ReturnType<typeof getSSLEnforcementConfiguration>>
export type SSLEnforcementError = unknown

export const useSSLEnforcementQuery = <TData = SSLEnforcementData>(
  { projectRef }: SSLEnforcementVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<SSLEnforcementData, SSLEnforcementError, TData> = {}
) =>
  useQuery<SSLEnforcementData, SSLEnforcementError, TData>(
    sslEnforcementKeys.list(projectRef),
    ({ signal }) => getSSLEnforcementConfiguration({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useSSLEnforcementPrefetch = ({ projectRef }: SSLEnforcementVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(sslEnforcementKeys.list(projectRef), ({ signal }) =>
        getSSLEnforcementConfiguration({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
