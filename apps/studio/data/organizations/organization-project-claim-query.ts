import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { organizationKeys } from './keys'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

type OrganizationProjectClaimVariables = {
  slug: string
  token: string
}

// todo replace with API type once exposed again -  components['schemas']['OrganizationProjectClaimResponse']
export type OrganizationProjectClaimResponse = {
  created_at: string
  /** Format: uuid */
  created_by: string
  expires_at: string
  preview: {
    errors: {
      key: string
      message: string
    }[]
    info: {
      key: string
      message: string
    }[]
    members_exceeding_free_project_limit: {
      limit: number
      name: string
    }[]
    /** @enum {string} */
    source_subscription_plan: 'free' | 'pro' | 'team' | 'enterprise'
    target_organization_eligible: boolean | null
    target_organization_has_free_project_slots: boolean | null
    /** @enum {string|null} */
    target_subscription_plan: 'free' | 'pro' | 'team' | 'enterprise' | null
    valid: boolean
    warnings: {
      key: string
      message: string
    }[]
  }
  project: {
    name: string
    ref: string
  }
}

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
  return data as OrganizationProjectClaimResponse
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
