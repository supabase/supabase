import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationUpdateVariables = {
  slug: string
  name?: string
  billing_email?: string
  opt_in_tags?: string[]
}

export async function updateOrganization({
  slug,
  name,
  billing_email,
  opt_in_tags,
}: OrganizationUpdateVariables) {
  // @ts-ignore [Joshen] API spec is wrong
  const payload: components['schemas']['UpdateOrganizationBody'] = {}
  if (name) payload.name = name
  if (billing_email) payload.billing_email = billing_email
  if (opt_in_tags) payload.opt_in_tags = opt_in_tags

  const { data, error } = await patch('/platform/organizations/{slug}', {
    params: { path: { slug } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

type OrganizationUpdateData = Awaited<ReturnType<typeof updateOrganization>>

export const useOrganizationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>(
    (vars) => updateOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] Not sure if necessary to refresh the organizations list though
        await queryClient.invalidateQueries(organizationKeys.list())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
