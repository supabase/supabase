import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { storageKeys } from './keys'

type StorageArchiveCreateVariables = {
  projectRef?: string
}

const createStorageArchive = async ({ projectRef }: StorageArchiveCreateVariables) => {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/storage/{ref}/archive', {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

type StorageArchiveCreateData = Awaited<ReturnType<typeof createStorageArchive>>

export function useStorageArchiveCreateMutation({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<StorageArchiveCreateData, ResponseError, StorageArchiveCreateVariables>,
  'mutationFn'
> = {}) {
  const queryClient = useQueryClient()

  return useMutation<StorageArchiveCreateData, ResponseError, StorageArchiveCreateVariables>(
    (vars) => createStorageArchive(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageKeys.archive(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create storage archive: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
