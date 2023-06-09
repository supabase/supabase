import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { subscriptionKeys } from './keys'

export type ProjectAddonUpdateVariables = {
  projectRef: string
  variant: string
  type: 'custom_domain' | 'compute_instance' | 'pitr'
}

export type ProjectAddonUpdateResponse = {
  error?: any
}

export async function updateSubscriptionAddon({
  projectRef,
  variant,
  type,
}: ProjectAddonUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!variant) throw new Error('variant is required')
  if (!type) throw new Error('type is required')

  const response = (await post(`${API_URL}/projects/${projectRef}/billing/addons`, {
    addon_type: type,
    addon_variant: variant,
  })) as ProjectAddonUpdateResponse
  if (response.error) throw response.error

  return response
}

type ProjectAddonUpdateData = Awaited<ReturnType<typeof updateSubscriptionAddon>>

export const useProjectAddonUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ProjectAddonUpdateData, unknown, ProjectAddonUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectAddonUpdateData, unknown, ProjectAddonUpdateVariables>(
    (vars) => updateSubscriptionAddon(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        // [Joshen] Only invalidate addons, not subscriptions, as AddOn section in
        // subscription page is using AddOn react query
        await queryClient.invalidateQueries(subscriptionKeys.addons(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
