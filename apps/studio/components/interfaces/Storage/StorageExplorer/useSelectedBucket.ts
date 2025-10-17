import { useParams } from 'common'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useStorageV2Page } from '../Storage.utils'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()
  const page = useStorageV2Page()

  const {
    data: analyticsBuckets = [],
    isSuccess: isSuccessAnalyticsBuckets,
    isError: isErrorAnalyticsBuckets,
    error: errorAnalyticsBuckets,
  } = useAnalyticsBucketsQuery({ projectRef: ref })

  const {
    data: buckets = [],
    isSuccess: isSuccessBuckets,
    isError: isErrorBuckets,
    error: errorBuckets,
  } = useBucketsQuery({ projectRef: ref })

  const isSuccess = isSuccessBuckets && isSuccessAnalyticsBuckets
  const isError = isErrorBuckets || isErrorAnalyticsBuckets
  const error = errorBuckets || errorAnalyticsBuckets

  const bucket =
    page === 'files'
      ? buckets.find((b) => b.id === bucketId)
      : page === 'analytics'
        ? analyticsBuckets.find((b) => b.id === bucketId)
        : // [Joshen] Temp fallback to buckets for backwards compatibility old UI
          buckets.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
