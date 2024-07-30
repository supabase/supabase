import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { storageCredentialsKeys } from './s3-access-key-keys'

type CreateS3AccessKeyCredentialVariables = {
  description: string
  projectRef?: string
}

const createS3AccessKeyCredential = async ({
  description,
  projectRef,
}: CreateS3AccessKeyCredentialVariables) => {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/storage/{ref}/credentials', {
    params: { path: { ref: projectRef } },
    body: { description },
  })

  if (error) handleError(error)
  return data
}

type S3AccessKeyDeleteData = Awaited<ReturnType<typeof createS3AccessKeyCredential>>

export function useS3AccessKeyCreateMutation({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<S3AccessKeyDeleteData, ResponseError, CreateS3AccessKeyCredentialVariables>,
  'mutationFn'
> = {}) {
  const queryClient = useQueryClient()

  return useMutation<S3AccessKeyDeleteData, ResponseError, CreateS3AccessKeyCredentialVariables>(
    (vars) => createS3AccessKeyCredential(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageCredentialsKeys.credentials(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create S3 access key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
