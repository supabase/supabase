import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { sslEnforcementKeys } from './keys'

export type SSLEnforcementVariables = { projectRef?: string }

export async function getSSLEnforcementConfiguration(
  { projectRef }: SSLEnforcementVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/ssl-enforcement`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  // Not allowed error is a valid response to denote if a project
  // has access to the SSL enforcement UI, so we'll handle it here
  if (error) {
    const isNotAllowedError =
      (error as any)?.code === 400 &&
      (error as any)?.message?.includes('not allowed to configure SSL enforcements')

    if (isNotAllowedError) {
      return {
        appliedSuccessfully: false,
        currentConfig: { database: false },
        isNotAllowed: true,
      } as const
    } else {
      handleError(error)
    }
  }

  return data
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
