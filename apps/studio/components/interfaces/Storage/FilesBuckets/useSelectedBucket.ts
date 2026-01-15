import { useParams } from 'common'
import { useBucketsQuery } from 'data/storage/buckets-query'

export const useSelectedBucket = () => {
  const { ref, bucketId } = useParams()

  return useBucketsQuery(
    { projectRef: ref },
    {
      select(data) {
        return data.find((b) => b.id === bucketId)
      },
    }
  )
}
