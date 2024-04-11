import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storageCredentialsKeys } from './storage-credentials-keys'
import { post } from 'data/fetchers'

type CreateStorageCredential = {
  description: string
  projectRef?: string
}
const createStorageCredential = async ({ description, projectRef }: CreateStorageCredential) => {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const res = await post('/platform/storage/{ref}/credentials', {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      description,
    },
  })

  return res
}

type StorageCredentialsCreateMutation = {
  projectRef?: string
}

export function useStorageCredentialsCreateMutation({
  projectRef,
}: StorageCredentialsCreateMutation) {
  const queryClient = useQueryClient()

  const keys = storageCredentialsKeys.credentials(projectRef)

  return useMutation({
    mutationFn: ({ description }: { description: string }) =>
      createStorageCredential({ description, projectRef }),
    onSettled: () => {
      queryClient.invalidateQueries(keys)
    },
    // enabled: projectRef !== undefined,
  })
}
