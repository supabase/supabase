import { useParams } from 'common'
import { useBucketQuery } from 'data/storage/buckets-query'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()

  const query = useBucketQuery(
    {
      projectRef: ref,
      bucketId,
    },
    {
      enabled: !!bucketId,
    }
  )

  return query
}
