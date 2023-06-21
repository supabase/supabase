import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { storageKeys } from './keys'

export type BucketDeleteVariables = {
  projectRef: string
  id: string
}

export async function deleteBucket({ projectRef, id }: BucketDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const emptyBucketRes = await post(`${API_URL}/storage/${projectRef}/buckets/${id}/empty`, {})
  if (emptyBucketRes.error) throw emptyBucketRes.error

  const response = await delete_(`${API_URL}/storage/${projectRef}/buckets/${id}`)
  if (response.error) throw response.error
  return response
}

type BucketDeleteData = Awaited<ReturnType<typeof deleteBucket>>

export const useBucketDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<BucketDeleteData, unknown, BucketDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketDeleteData, unknown, BucketDeleteVariables>(
    (vars) => deleteBucket(vars),
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
