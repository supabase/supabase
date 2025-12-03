import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { configKeys } from './keys'

type StorageConfigUpdatePayload = components['schemas']['UpdateStorageConfigBody']

export type ProjectStorageConfigUpdateUpdateVariables = StorageConfigUpdatePayload & {
  projectRef: string
}

export async function updateProjectStorageConfigUpdate({
  projectRef,
  fileSizeLimit,
  features,
}: ProjectStorageConfigUpdateUpdateVariables) {
  const { data, error } = await patch('/platform/projects/{ref}/config/storage', {
    params: { path: { ref: projectRef } },
    body: { fileSizeLimit, features },
  })
  if (error) handleError(error)
  return data
}

type ProjectStorageConfigUpdateUpdateData = Awaited<
  ReturnType<typeof updateProjectStorageConfigUpdate>
>

export const useProjectStorageConfigUpdateUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => updateProjectStorageConfigUpdate(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: configKeys.storage(projectRef) })
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
