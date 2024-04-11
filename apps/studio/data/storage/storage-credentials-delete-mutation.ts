import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storageCredentialsKeys } from './storage-credentials-keys'
import { del } from 'data/fetchers'

type StorageCredentialsDeleteMutation = {
  projectRef?: string
  id?: string
}

const deleteStorageCredential = async ({ projectRef, id }: StorageCredentialsDeleteMutation) => {
  if (!projectRef || !id) {
    throw new Error('projectRef and id are required')
  }

  const res = await del('/platform/storage/{ref}/credentials/{id}', {
    params: {
      path: {
        ref: projectRef,
        id,
      },
    },
  })

  return res
}

export function useStorageCredentialsDeleteMutation({
  projectRef,
}: StorageCredentialsDeleteMutation) {
  const queryClient = useQueryClient()

  const keys = storageCredentialsKeys.credentials(projectRef)

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteStorageCredential({ projectRef, id }),
    onSettled: () => {
      queryClient.invalidateQueries(keys)
    },
  })
}
