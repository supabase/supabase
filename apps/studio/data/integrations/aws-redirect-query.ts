import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { ResponseError } from 'types'
import { integrationKeys } from './keys'

export type AwsRedirectVariables = {
  organizationSlug?: string
}

export async function getAwsRedirect(
  { organizationSlug }: AwsRedirectVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')

  // TODO: Replace with actual AWS Marketplace API endpoint when ready
  // For now, return hardcoded AWS URL
  return {
    url: 'https://aws.amazon.com',
  }
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
