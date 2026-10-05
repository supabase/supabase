import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

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
  })
  if (error) throw handleError(error)

  return (data as components['schemas']['TaxIdResponse_Output']).tax_id
}

export type OrganizationTaxIdData = Awaited<ReturnType<typeof getOrganizationTaxId>>
export type OrganizationTaxIdError = ResponseError

export const useOrganizationTaxIdQuery = <TData = OrganizationTaxIdData>(
  { slug }: OrganizationTaxIdVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationTaxIdData, OrganizationTaxIdError, TData> = {}
) => {
  const { can: canReadSubscriptions } = useAsyncCheckPermissionsV2(
    'billing_read'
  )

  return useQuery<OrganizationTaxIdData, OrganizationTaxIdError, TData>({
    queryKey: organizationKeys.taxId(slug),
    queryFn: ({ signal }) => getOrganizationTaxId({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined' && canReadSubscriptions,
    ...options,
  })
}
