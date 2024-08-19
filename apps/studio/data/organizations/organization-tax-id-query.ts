import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { organizationKeys } from './keys'
import type { ResponseError } from 'types'
import { components } from 'api-types'

export type OrganizationTaxIdVariables = {
  slug?: string
}

export async function getOrganizationTaxId(
  { slug }: OrganizationTaxIdVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/tax-ids`, {
    params: { path: { slug } },
    signal,
    headers: {
      Version: '2',
    },
  })
  if (error) throw handleError(error)

  // @ts-ignore wrong typing due to mgmt api versioning
  return (data as components['schemas']['TaxIdV2Response']).tax_id
}

export type OrganizationTaxIdData = Awaited<ReturnType<typeof getOrganizationTaxId>>
export type OrganizationTaxIdError = ResponseError

export const useOrganizationTaxIdQuery = <TData = OrganizationTaxIdData>(
  { slug }: OrganizationTaxIdVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationTaxIdData, OrganizationTaxIdError, TData> = {}
) =>
  useQuery<OrganizationTaxIdData, OrganizationTaxIdError, TData>(
    organizationKeys.taxId(slug),
    ({ signal }) => getOrganizationTaxId({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
