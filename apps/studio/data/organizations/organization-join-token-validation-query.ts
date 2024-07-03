import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationJoinTokenValidationVariables = {
  slug: string
  token: string
}

export type TokenInfo = components['schemas']['InviteResponse'] | undefined

// [Joshen TODO] Should be deprecated now - double check before deleting

export async function validateTokenInformation(
  { slug, token }: OrganizationJoinTokenValidationVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(`/platform/organizations/{slug}/members/join`, {
    params: { path: { slug }, query: { token } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationJoinTokenValidationData = Awaited<
  ReturnType<typeof validateTokenInformation>
>
export type OrganizationJoinTokenValidationError = ResponseError

export const useOrganizationJoinTokenValidationQuery = <
  TData = OrganizationJoinTokenValidationData,
>(
  { slug, token }: OrganizationJoinTokenValidationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    OrganizationJoinTokenValidationData,
    OrganizationJoinTokenValidationError,
    TData
  > = {}
) =>
  useQuery<OrganizationJoinTokenValidationData, OrganizationJoinTokenValidationError, TData>(
    organizationKeys.tokenValidation(slug, token),
    ({ signal }) => validateTokenInformation({ slug, token }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
