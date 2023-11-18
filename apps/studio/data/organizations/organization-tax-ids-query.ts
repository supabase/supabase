import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { organizationKeys } from './keys'
import { ResponseError } from 'types'

export type OrganizationTaxIDsVariables = {
  slug?: string
}

export type TaxId = {
  country: string
  created: number
  customer: string
  id: string
  livemode: boolean
  object: 'tax_id'
  type: string
  value: string
  verification: {
    status: string
    verified_address: string | null
    verified_name: string | null
  }
}

export async function getOrganizationTaxIDs(
  { slug }: OrganizationTaxIDsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const data = await get(`${API_URL}/organizations/${slug}/tax-ids`, { signal })
  if (data.error) throw data.error

  return data.data as TaxId[]
}

export type OrganizationTaxIDsData = Awaited<ReturnType<typeof getOrganizationTaxIDs>>
export type OrganizationTaxIDsError = ResponseError

export const useOrganizationTaxIDsQuery = <TData = OrganizationTaxIDsData>(
  { slug }: OrganizationTaxIDsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationTaxIDsData, OrganizationTaxIDsError, TData> = {}
) =>
  useQuery<OrganizationTaxIDsData, OrganizationTaxIDsError, TData>(
    organizationKeys.taxIds(slug),
    ({ signal }) => getOrganizationTaxIDs({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
