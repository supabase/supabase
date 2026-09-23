import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { pollUntilBucketEmpty } from './bucket-util'
import { storageKeys } from './keys'
import { del, handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type BucketDeleteVariables = {
  projectRef: string
  id: string
}

async function deleteBucket({ projectRef, id }: BucketDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { error: emptyBucketError } = await post('/platform/storage/{ref}/buckets/{id}/empty', {
    params: { path: { ref: projectRef, id } },
  })
  if (emptyBucketError) handleError(emptyBucketError)

  await pollUntilBucketEmpty({ projectRef, bucketId: id })

  const { data, error: deleteBucketError } = await del('/platform/storage/{ref}/buckets/{id}', {
    params: { path: { ref: projectRef, id } },
  } as any)

  if (deleteBucketError) handleError(deleteBucketError)
  return data
}

type BucketDeleteData = Awaited<ReturnType<typeof deleteBucket>>

export const useBucketDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<BucketDeleteData, ResponseError, BucketDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketDeleteData, ResponseError, BucketDeleteVariables>({
    mutationFn: (vars) => deleteBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, id } = variables

      const deletedBucketQueryKey = storageKeys.bucket(projectRef, id)
      await queryClient.cancelQueries({ queryKey: deletedBucketQueryKey })
      queryClient.removeQueries({ queryKey: deletedBucketQueryKey })

      await onSuccess?.(data, variables, context)

      // Fire-and-forget: only the bucket list needs refreshing, and it shouldn't block
      // onSuccess (modal close/navigation) above.
      //
      // Keyed on `buckets`, not `bucketsList`: the latter builds a params object with
      // every key present and `undefined`, and React Query's partial match compares the
      // keys it is given — so `{ sortColumn: undefined }` never matches a list actually
      // registered as `{ sortColumn: 'name' }`. `buckets` is a plain array prefix of
      // every list key, so it matches them all.
      //
      // `refetchType: 'all'` because the deletion usually happens from the bucket page,
      // where the list query is inactive. Marking it stale alone leaves whoever
      // navigates back looking at the deleted bucket.
      void queryClient.invalidateQueries({
        queryKey: storageKeys.buckets(projectRef),
        refetchType: 'all',
      })
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
