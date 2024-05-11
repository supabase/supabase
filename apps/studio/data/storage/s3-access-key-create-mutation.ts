import { useMutation, useQueryClient } from '@tanstack/react-query'
import { storageCredentialsKeys } from './s3-access-key-keys'
import { post } from 'data/fetchers'

type CreateS3AccessKeyCredential = {
  description: string
  projectRef?: string
}
const createS3AccessKeyCredential = async ({
  description,
  projectRef,
}: CreateS3AccessKeyCredential) => {
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

type S3AccessKeyCreateMutation = {
  projectRef?: string
}

export function useS3AccessKeyCreateMutation({ projectRef }: S3AccessKeyCreateMutation) {
  const queryClient = useQueryClient()

  const keys = storageCredentialsKeys.credentials(projectRef)

  return useMutation({
    mutationFn: ({ description }: { description: string }) =>
      createS3AccessKeyCredential({ description, projectRef }),
    onSettled: () => {
      queryClient.invalidateQueries(keys)
    },
  })
}
