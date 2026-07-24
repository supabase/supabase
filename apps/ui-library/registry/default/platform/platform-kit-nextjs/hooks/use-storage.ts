import { useQuery } from '@tanstack/react-query'

import { usePlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/context'
import { NotSupportedError } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/errors'

// GET Buckets
export const useGetBuckets = () => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['buckets', adapter.projectRef ?? 'local'],
    queryFn: () => {
      if (!adapter.listBuckets) throw new NotSupportedError('storage')
      return adapter.listBuckets()
    },
    enabled: adapter.features.storage,
    retry: false,
  })
}

// LIST Objects
export const useListObjects = (bucketId: string, path = '') => {
  const adapter = usePlatformAdapter()
  return useQuery({
    queryKey: ['objects', adapter.projectRef ?? 'local', bucketId, path],
    queryFn: () => {
      if (!adapter.listObjects) throw new NotSupportedError('storage')
      return adapter.listObjects(bucketId, path)
    },
    enabled: adapter.features.storage && !!bucketId,
  })
}
