import { useParams } from 'common'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useStorageV2Page } from '../Storage.utils'

export const useSelectedBucket = () => {
  const page = useStorageV2Page()
  const { ref, bucketId } = useParams()

  const { data: buckets = [], isSuccess, isError, error } = useBucketsQuery({ projectRef: ref })
  const bucketsByType =
    page === 'files'
      ? buckets.filter((b) => b.type === 'STANDARD')
      : page === 'analytics'
        ? buckets.filter((b) => b.type === 'ANALYTICS')
        : buckets
  const bucket = bucketsByType.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
