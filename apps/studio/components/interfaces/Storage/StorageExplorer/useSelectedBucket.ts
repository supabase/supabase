import { useParams } from 'common'
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useStorageV2Page } from '../Storage.utils'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()
  const page = useStorageV2Page()
  const hasIcebergEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })

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

  const isSuccess = hasIcebergEnabled
    ? isSuccessBuckets && isSuccessAnalyticsBuckets
    : isSuccessBuckets
  const isError = hasIcebergEnabled ? isErrorBuckets || isErrorAnalyticsBuckets : isErrorBuckets
  const error = hasIcebergEnabled ? errorBuckets || errorAnalyticsBuckets : errorBuckets

  const bucket =
    page === 'files'
      ? buckets.find((b) => b.id === bucketId)
      : page === 'analytics'
        ? analyticsBuckets.find((b: any) => b.id === bucketId)
        : buckets.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
