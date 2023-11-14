import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { subscriptionKeys } from './keys'

export type ProjectAddonRemoveVariables = {
  projectRef: string
  variant: string
}

export type ProjectAddonRemoveResponse = {
  error?: any
}

export async function removeSubscriptionAddon({
  projectRef,
  variant,
}: ProjectAddonRemoveVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!variant) throw new Error('variant is required')

  const response = (await delete_(
    `${API_URL}/projects/${projectRef}/billing/addons/${variant}`
  )) as ProjectAddonRemoveResponse
  if (response.error) throw response.error

  return response
}

type ProjectAddonRemoveData = Awaited<ReturnType<typeof removeSubscriptionAddon>>

export const useProjectAddonRemoveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectAddonRemoveData, ResponseError, ProjectAddonRemoveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectAddonRemoveData, ResponseError, ProjectAddonRemoveVariables>(
    (vars) => removeSubscriptionAddon(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        // [Joshen] Only invalidate addons, not subscriptions, as AddOn section in
        // subscription page is using AddOn react query
        await queryClient.invalidateQueries(subscriptionKeys.addons(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to remove addon: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
