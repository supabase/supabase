import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type BucketPurgeCDNCacheVariables = {
  projectRef: string
  id: string
}

async function purgeBucketCDNCache({ projectRef, id }: BucketPurgeCDNCacheVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error } = await post('/platform/storage/{ref}/cdn/purge-bucket', {
    params: { path: { ref: projectRef } },
    body: {
      bucket_id: id,
    },
  })

  if (error) handleError(error)
  return data
}

type BucketPurgeCDNCacheData = Awaited<ReturnType<typeof purgeBucketCDNCache>>

export const useBucketPurgeCDNCacheMutation = (
  options: Omit<
    UseCustomMutationOptions<BucketPurgeCDNCacheData, ResponseError, BucketPurgeCDNCacheVariables>,
    'mutationFn'
  > = {}
) => {
  return useMutation<BucketPurgeCDNCacheData, ResponseError, BucketPurgeCDNCacheVariables>({
    mutationFn: (vars) => purgeBucketCDNCache(vars),
    async onError(data) {
      toast.error(`Failed to purge bucket CDN cache: ${data.message}`)
    },
    ...options,
  })
}
