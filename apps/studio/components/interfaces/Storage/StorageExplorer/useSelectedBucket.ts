import { useParams } from 'common'
import { useIsNewStorageUIEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useStorageV2Page } from '../Storage.utils'

// [Joshen] Adding isStorageV2 checks here to support the existing UI while API changes are not on prod just yet

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()
  const isStorageV2 = useIsNewStorageUIEnabled()
  const page = useStorageV2Page()

  const {
    data: analyticsBuckets = [],
    isSuccess: isSuccessAnalyticsBuckets,
    isError: isErrorAnalyticsBuckets,
    error: errorAnalyticsBuckets,
  } = useAnalyticsBucketsQuery({ projectRef: ref }, { enabled: isStorageV2 })

  const {
    data: buckets = [],
    isSuccess: isSuccessBuckets,
    isError: isErrorBuckets,
    error: errorBuckets,
  } = useBucketsQuery({ projectRef: ref })

  const isSuccess = isStorageV2 ? isSuccessBuckets && isSuccessAnalyticsBuckets : isSuccessBuckets
  const isError = isStorageV2 ? isErrorBuckets || isErrorAnalyticsBuckets : isErrorBuckets
  const error = isStorageV2 ? errorBuckets || errorAnalyticsBuckets : errorBuckets

  const bucket =
    page === 'files'
      ? buckets.find((b) => b.id === bucketId)
      : page === 'analytics'
        ? analyticsBuckets.find((b: any) => b.id === bucketId)
        : // [Joshen] Remove typecasts bucket: any once infra changes for analytics bucket is in
          // [Joshen] Temp fallback to buckets for backwards compatibility old UI
          buckets.find((b) => b.id === bucketId)

  return { bucket, isSuccess, isError, error }
}
