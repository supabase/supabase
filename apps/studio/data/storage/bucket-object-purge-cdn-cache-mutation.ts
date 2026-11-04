import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type BucketObjectPurgeCDNCacheVariables = {
  projectRef: string
  id: string
  path: string
}

async function purgeBucketObjectCDNCache({
  projectRef,
  id,
  path,
}: BucketObjectPurgeCDNCacheVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')
  if (!path) throw new Error('Bucket object path is required')

  const { data, error } = await post('/platform/storage/{ref}/cdn/purge-object', {
    params: { path: { ref: projectRef } },
    body: {
      bucket_id: id,
      path,
    },
  })

  if (error) handleError(error)
  return data
}

type BucketObjectPurgeCDNCacheData = Awaited<ReturnType<typeof purgeBucketObjectCDNCache>>

export const useBucketObjectPurgeCDNCacheMutation = (
  options: Omit<
    UseCustomMutationOptions<
      BucketObjectPurgeCDNCacheData,
      ResponseError,
      BucketObjectPurgeCDNCacheVariables
    >,
    'mutationFn'
  > = {}
) => {
  return useMutation<
    BucketObjectPurgeCDNCacheData,
    ResponseError,
    BucketObjectPurgeCDNCacheVariables
  >({
    mutationFn: (vars) => purgeBucketObjectCDNCache(vars),
    async onError(data) {
      toast.error(`Failed to purge bucket object CDN cache: ${data.message}`)
    },
    ...options,
  })
}
