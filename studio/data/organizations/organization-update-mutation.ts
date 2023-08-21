import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationUpdateVariables = {
  slug: string
  name: string
  billing_email: string
}

export async function updateOrganization({ slug, billing_email }: OrganizationUpdateVariables) {
  const response = await patch(`${API_URL}/organizations/${slug}`, { name, billing_email })
  if (response.error) throw response.error
  return response
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
          toast.error(`Failed to update billing email: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
