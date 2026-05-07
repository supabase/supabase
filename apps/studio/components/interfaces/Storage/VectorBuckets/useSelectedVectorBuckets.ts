import { useParams } from 'common'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'

export const useSelectedVectorBucket = () => {
  const { ref: projectRef, bucketId } = useParams()

  return useVectorBucketsQuery(
    { projectRef },
    {
      select(data) {
        return data.vectorBuckets.find((x) => x.vectorBucketName === bucketId)
      },
    }
  )
}
