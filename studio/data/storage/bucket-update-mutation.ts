import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { storageKeys } from './keys'

export type BucketUpdateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

export async function updateBucket({
  projectRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const response = await patch(`${API_URL}/storage/${projectRef}/buckets/${id}`, {
    public: isPublic,
    file_size_limit,
    allowed_mime_types,
  })
  if (response.error) throw response.error
  return response
}

type BucketUpdateData = Awaited<ReturnType<typeof updateBucket>>

export const useBucketUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<BucketUpdateData, unknown, BucketUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketUpdateData, unknown, BucketUpdateVariables>(
    (vars) => updateBucket(vars),
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
