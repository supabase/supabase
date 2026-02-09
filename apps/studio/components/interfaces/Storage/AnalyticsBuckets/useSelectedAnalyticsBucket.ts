import { useParams } from 'common'
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'

export const useSelectedAnalyticsBucket = () => {
  const { ref, bucketId } = useParams()
  const hasIcebergEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })

  return useAnalyticsBucketsQuery(
    { projectRef: ref },
    {
      enabled: hasIcebergEnabled,
      select(data) {
        return data.find((x) => x.name === bucketId)
      },
    }
  )
}
