import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectStorageConfigUpdateUpdateVariables = {
  projectRef: string
  fileSizeLimit: number
  features?: {
    imageTransformation: {
      enabled: boolean
    }
  }
}

export async function updateProjectStorageConfigUpdate({
  projectRef,
  fileSizeLimit,
  features,
}: ProjectStorageConfigUpdateUpdateVariables) {
  const response = await patch(`${API_URL}/projects/${projectRef}/config/storage`, {
    fileSizeLimit,
    features,
  })
  if (response.error) throw response.error
  return response
}

type ProjectStorageConfigUpdateUpdateData = Awaited<
  ReturnType<typeof updateProjectStorageConfigUpdate>
>

export const useProjectStorageConfigUpdateUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    ProjectStorageConfigUpdateUpdateData,
    ResponseError,
    ProjectStorageConfigUpdateUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectStorageConfigUpdateUpdateData,
    ResponseError,
    ProjectStorageConfigUpdateUpdateVariables
  >((vars) => updateProjectStorageConfigUpdate(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(configKeys.storage(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update storage settings: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
