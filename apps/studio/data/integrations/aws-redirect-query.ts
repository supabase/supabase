import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'
import { get, handleError } from 'data/fetchers'

export type AwsRedirectVariables = {
  organizationSlug?: string
}

export async function getAwsRedirect(
  { organizationSlug }: AwsRedirectVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/cloud-marketplace/redirect`, {
    params: { path: { slug: organizationSlug } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type AwsRedirectData = Awaited<ReturnType<typeof getAwsRedirect>>
export type AwsRedirectError = ResponseError

export const useAwsRedirectQuery = <TData = AwsRedirectData>(
  { organizationSlug }: AwsRedirectVariables,
  { enabled = true, ...options }: UseQueryOptions<AwsRedirectData, AwsRedirectError, TData> = {}
) =>
  useQuery<AwsRedirectData, AwsRedirectError, TData>(
    integrationKeys.awsRedirect(organizationSlug),
    ({ signal }) => getAwsRedirect({ organizationSlug }, signal),
    {
      enabled: enabled && typeof organizationSlug !== 'undefined',
      ...options,
    }
  )
