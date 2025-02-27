import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

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
) => {
  const canReadSubscriptions = useCheckPermissions(PermissionAction.BILLING_READ, 'stripe.tax_ids')
  return useQuery<OrganizationTaxIdData, OrganizationTaxIdError, TData>(
    organizationKeys.taxId(slug),
    ({ signal }) => getOrganizationTaxId({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined' && canReadSubscriptions,
      ...options,
    }
  )
}
