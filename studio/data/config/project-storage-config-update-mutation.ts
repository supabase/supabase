import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { configKeys } from './keys'

export type ProjectStorageConfigUpdateUpdateVariables = {
  projectRef: string
  fileSizeLimit: number
}

export async function updateProjectStorageConfigUpdate({
  projectRef,
  fileSizeLimit,
}: ProjectStorageConfigUpdateUpdateVariables) {
  const response = await patch(`${API_URL}/projects/${projectRef}/config/storage`, {
    fileSizeLimit,
  })
  if (response.error) {
    throw response.error
  }

  return response
}

type ProjectStorageConfigUpdateUpdateData = Awaited<
  ReturnType<typeof updateProjectStorageConfigUpdate>
>

export const useProjectStorageConfigUpdateUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<
    ProjectStorageConfigUpdateUpdateData,
    unknown,
    ProjectStorageConfigUpdateUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ProjectStorageConfigUpdateUpdateData,
    unknown,
    ProjectStorageConfigUpdateUpdateVariables
  >((vars) => updateProjectStorageConfigUpdate(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries(configKeys.storage(projectRef))

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
