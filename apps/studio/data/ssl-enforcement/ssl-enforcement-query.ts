import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
import { useCallback } from 'react'
import { sslEnforcementKeys } from './keys'

export type SSLEnforcementVariables = { projectRef?: string }

export type SSLEnforcementResponse = {
  appliedSuccessfully: boolean
  currentConfig: { database: boolean }
  error?: any
  isNotAllowed?: boolean
}

export async function getSSLEnforcementConfiguration(
  { projectRef }: SSLEnforcementVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = (await get(`${API_ADMIN_URL}/projects/${projectRef}/ssl-enforcement`, {
    signal,
  })) as SSLEnforcementResponse

  // Not allowed error is a valid response to denote if a project
  // has access to the SSL enforcement UI, so we'll handle it here
  if (response.error) {
    const isNotAllowedError =
      (response.error as any)?.code === 400 &&
      (response.error as any)?.message?.includes('not allowed to configure SSL enforcements')

    if (isNotAllowedError) {
      return {
        appliedSuccessfully: false,
        currentConfig: { database: false },
        isNotAllowed: true,
      } as SSLEnforcementResponse
    } else {
      throw response.error
    }
  }

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
