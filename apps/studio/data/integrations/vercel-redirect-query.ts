import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type VercelRedirectVariables = {
  installationId?: string
}

export async function getVercelRedirect(
  { installationId }: VercelRedirectVariables,
  signal?: AbortSignal
) {
  if (!installationId) throw new Error('installationId is required')

  const { data, error } = await get(`/platform/vercel/redirect/{installation_id}`, {
    params: { path: { installation_id: installationId } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type VercelRedirectData = Awaited<ReturnType<typeof getVercelRedirect>>
export type VercelRedirectError = ResponseError

export const useVercelRedirectQuery = <TData = VercelRedirectData>(
  { installationId }: VercelRedirectVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<VercelRedirectData, VercelRedirectError, TData> = {}
) =>
  useQuery<VercelRedirectData, VercelRedirectError, TData>(
    integrationKeys.vercelRedirect(installationId),
    ({ signal }) => getVercelRedirect({ installationId }, signal),
    {
      enabled: enabled && typeof installationId !== 'undefined',
      ...options,
    }
  )
