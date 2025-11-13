import { useParams } from 'common'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'

export const useSelectedVectorBucket = () => {
  const { ref: projectRef, bucketId } = useParams()

  const { data, error, isLoading, isSuccess, isError } = useVectorBucketsQuery({ projectRef })

  const bucket = (data?.vectorBuckets ?? []).find((x) => x.vectorBucketName === bucketId)

  return { data: bucket, isLoading, isSuccess, isError, error }
}
