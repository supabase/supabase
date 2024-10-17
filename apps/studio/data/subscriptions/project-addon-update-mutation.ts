import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'
import type { AddonVariantId, ProjectAddonType } from './types'

export type ProjectAddonUpdateVariables = {
  projectRef: string
  variant: AddonVariantId
  type: ProjectAddonType
}

export async function updateSubscriptionAddon({
  projectRef,
  variant,
  type,
}: ProjectAddonUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!variant) throw new Error('variant is required')
  if (!type) throw new Error('type is required')

  const { data, error } = await post(`/platform/projects/{ref}/billing/addons`, {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      addon_type: type,
      addon_variant: variant,
    },
  })

  if (error) handleError(error)
  return data
}

type ProjectAddonUpdateData = Awaited<ReturnType<typeof updateSubscriptionAddon>>

export const useProjectAddonUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectAddonUpdateData, ResponseError, ProjectAddonUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectAddonUpdateData, ResponseError, ProjectAddonUpdateVariables>(
    (vars) => updateSubscriptionAddon(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(subscriptionKeys.addons(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update addon: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
