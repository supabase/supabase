import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'
import { TaxId } from './organization-tax-ids-query'

export interface TaxIdValue {
  id: string
  type: string
  value: string
  name: string
}

export type OrganizationTaxIDsUpdateVariables = {
  slug: string
  existingIds: TaxId[]
  newIds: TaxIdValue[]
}

export async function updateOrganizationTaxIDs({
  slug,
  existingIds,
  newIds,
}: OrganizationTaxIDsUpdateVariables) {
  if (!slug) {
    console.error('Slug is required')
    return {}
  }

  // To make things simple we delete all existing ones and create new ones from this session
  if (existingIds.length > 0) {
    await Promise.all(
      existingIds.map(async (taxId) => {
        return await delete_(`${API_URL}/organizations/${slug}/tax-ids`, { id: taxId.id })
      })
    )
  }

  const createdIds = await Promise.all(
    newIds.map(async (taxId) => {
      const result = await post(`${API_URL}/organizations/${slug}/tax-ids`, {
        type: taxId.type,
        value: taxId.value,
      })
      return { id: taxId.id, result }
    })
  )

  const taxIdsWithErrors = createdIds.filter((taxId) => {
    if (taxId.result.error) return taxId
  })

  const idsCreated = createdIds
    .filter((taxId: any) => !taxId.result.error)
    .map((taxId: any) => taxId.result)

  return { created: idsCreated, errors: taxIdsWithErrors }
}

type OrganizationTaxIDsUpdateData = Awaited<ReturnType<typeof updateOrganizationTaxIDs>>

export const useOrganizationTaxIDsUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationTaxIDsUpdateData,
    ResponseError,
    OrganizationTaxIDsUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationTaxIDsUpdateData,
    ResponseError,
    OrganizationTaxIDsUpdateVariables
  >((vars) => updateOrganizationTaxIDs(vars), {
    async onSuccess(data, variables, context) {
      const { slug } = variables
      await queryClient.invalidateQueries(organizationKeys.taxIds(slug))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update tax IDs: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
