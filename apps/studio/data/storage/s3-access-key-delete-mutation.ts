import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storageCredentialsKeys } from './s3-access-key-keys'
import { del } from 'data/fetchers'

type S3AccessKeyDeleteMutation = {
  projectRef?: string
  id?: string
}

const deleteS3AccessKeyCredential = async ({ projectRef, id }: S3AccessKeyDeleteMutation) => {
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

export function useS3AccessKeyDeleteMutation({ projectRef }: S3AccessKeyDeleteMutation) {
  const queryClient = useQueryClient()

  const keys = storageCredentialsKeys.credentials(projectRef)

  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteS3AccessKeyCredential({ projectRef, id }),
    onSettled: () => {
      queryClient.invalidateQueries(keys)
    },
  })
}
