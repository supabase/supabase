import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ProjectByFlyExtensionIdVariables = {
  flyExtensionId: string
}

// [Joshen] Should be converted into a query instead of a mutation
// Will need to update sign-in-fly-tos.tsx as well

export async function getProjectByFlyExtensionId({
  flyExtensionId,
}: ProjectByFlyExtensionIdVariables) {
  const { data, error } = await get('/platform/projects/fly/{fly_extension_id}', {
    params: { path: { fly_extension_id: flyExtensionId } },
  })
  if (error) handleError(error)
  return data as { ref: string }
}

type ProjectByFlyExtensionIdData = Awaited<ReturnType<typeof getProjectByFlyExtensionId>>

export const useProjectByFlyExtensionIdMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectByFlyExtensionIdData, ResponseError, ProjectByFlyExtensionIdVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ProjectByFlyExtensionIdData, ResponseError, ProjectByFlyExtensionIdVariables>(
    (vars) => getProjectByFlyExtensionId(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to get project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
