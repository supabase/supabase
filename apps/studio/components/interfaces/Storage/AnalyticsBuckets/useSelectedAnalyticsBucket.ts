import { useParams } from 'common'
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'

export const useSelectedAnalyticsBucket = () => {
  const { ref, bucketId } = useParams()
  const hasIcebergEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })

  const {
    data = [],
    error,
    isLoading,
    isSuccess,
    isError,
  } = useAnalyticsBucketsQuery({ projectRef: ref }, { enabled: hasIcebergEnabled })

  const bucket = data.find((x) => x.id === bucketId)

  return { data: bucket, isLoading, isSuccess, isError, error }
}
