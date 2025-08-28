import { useParams } from 'common'
import { useBucketsQuery } from 'data/storage/buckets-query'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()

  const { data: buckets = [], isSuccess, isError, error } = useBucketsQuery({ projectRef: ref })
  const bucket = buckets.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
