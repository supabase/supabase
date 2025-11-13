import { useParams } from 'common'
import { useBucketsQuery } from 'data/storage/buckets-query'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()

  const {
    data: buckets = [],
    error,
    isLoading,
    isSuccess,
    isError,
  } = useBucketsQuery({ projectRef: ref })

  const bucket = buckets.find((b) => b.id === bucketId)

  return { data: bucket, isLoading, isSuccess, isError, error }
}
