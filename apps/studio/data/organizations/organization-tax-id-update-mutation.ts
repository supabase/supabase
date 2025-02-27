import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationTaxIdUpdateVariables = {
  slug: string
  taxId: { type: string; value: string; country?: string } | null
}

export async function updateOrganizationTaxId({ slug, taxId }: OrganizationTaxIdUpdateVariables) {
  if (!slug) {
    throw new Error('Slug is required')
  }

  if (taxId != null) {
    const { data, error } = await put(`/platform/organizations/{slug}/tax-ids`, {
      params: {
        path: {
          slug,
        },
      },
      body: { type: taxId.type, value: taxId.value, country: taxId.country },
    })

    if (error) handleError(error)

    return data
  } else {
    // @ts-ignore wrong type due to API versioning
    const { data, error } = await del(`/platform/organizations/{slug}/tax-ids`, {
      params: {
        path: {
          slug,
        },
      },
      headers: {
        Version: '2',
      },
    })

    if (error) handleError(error)

    return data
  }
}

type OrganizationTaxIdUpdateData = Awaited<ReturnType<typeof updateOrganizationTaxId>>

export const useOrganizationTaxIdUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationTaxIdUpdateData, ResponseError, OrganizationTaxIdUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationTaxIdUpdateData, ResponseError, OrganizationTaxIdUpdateVariables>(
    (vars) => updateOrganizationTaxId(vars),
    {
      async onSuccess(data, variables, context) {
        const { slug } = variables

        // We already have the data, no need to refetch
        queryClient.setQueryData(organizationKeys.taxId(slug), data.tax_id)
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update tax id: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
