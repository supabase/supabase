import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { organizationKeys } from './keys'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

type OrganizationProjectClaimVariables = {
  slug: string
  token: string
}

export type OrganizationProjectClaimResponse =
  components['schemas']['OrganizationProjectClaimResponse']

async function getOrganizationProjectClaim(
  { slug, token }: OrganizationProjectClaimVariables,
  signal?: AbortSignal
) {
  if (!slug || !token) throw new Error('Slug and token are required')

  const { data, error } = await get(`/v1/organizations/{slug}/project-claim/{token}`, {
    params: { path: { slug, token } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationProjectClaimData = Awaited<ReturnType<typeof getOrganizationProjectClaim>>
export type OrganizationProjectClaimError = ResponseError

export const useOrganizationProjectClaimQuery = <TData = OrganizationProjectClaimData>(
  { slug, token }: OrganizationProjectClaimVariables,
  {
    ...options
  }: UseQueryOptions<OrganizationProjectClaimData, OrganizationProjectClaimError, TData> = {}
) =>
  useQuery<OrganizationProjectClaimData, OrganizationProjectClaimError, TData>(
    organizationKeys.projectClaim(slug, token),
    ({ signal }) => getOrganizationProjectClaim({ slug, token }, signal),
    { ...options }
  )
