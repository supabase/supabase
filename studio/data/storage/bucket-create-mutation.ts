import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { storageKeys } from './keys'

export type BucketCreateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

export async function createBucket({
  projectRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const response = await post(`${API_URL}/storage/${projectRef}/buckets`, {
    id,
    public: isPublic,
    file_size_limit,
    allowed_mime_types,
  })
  if (response.error) throw response.error
  return response
}

type BucketCreateData = Awaited<ReturnType<typeof createBucket>>

export const useBucketCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<BucketCreateData, unknown, BucketCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketCreateData, unknown, BucketCreateVariables>(
    (vars) => createBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
