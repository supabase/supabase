import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { storageCredentialsKeys } from './s3-access-key-keys'

type S3AccessKeyDeleteVariables = {
  projectRef?: string
  id?: string
}

const deleteS3AccessKeyCredential = async ({ projectRef, id }: S3AccessKeyDeleteVariables) => {
  if (!projectRef || !id) throw new Error('projectRef and id are required')

  const { data, error } = await del('/platform/storage/{ref}/credentials/{id}', {
    params: { path: { ref: projectRef, id } },
  })

  if (error) {
    // [Joshen] This is only temporary and should be removed once the issue on API (storage) is resolved
    // Currently the API throws a 500 despite the secret getting removed correctly
    if ((error as ResponseError).message !== 'Failed to delete project storage credential') {
      handleError(error)
    }
  }

  return data
}

type S3AccessKeyDeleteData = Awaited<ReturnType<typeof deleteS3AccessKeyCredential>>

export function useS3AccessKeyDeleteMutation({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<S3AccessKeyDeleteData, ResponseError, S3AccessKeyDeleteVariables>,
  'mutationFn'
> = {}) {
  const queryClient = useQueryClient()

  return useMutation<S3AccessKeyDeleteData, ResponseError, S3AccessKeyDeleteVariables>(
    (vars) => deleteS3AccessKeyCredential(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageCredentialsKeys.credentials(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete S3 access key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
