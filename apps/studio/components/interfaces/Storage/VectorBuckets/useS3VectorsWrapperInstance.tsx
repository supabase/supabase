import { useMemo } from 'react'

import {
  WRAPPER_HANDLERS,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { wrapperMetaComparator } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { type FDW, useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getVectorBucketFDWName } from './VectorBuckets.utils'

export const useS3VectorsWrapperInstance = (
  { bucketId }: { bucketId?: string },
  options?: { enabled?: boolean; refetchInterval?: (data: FDW[] | undefined) => number | false }
) => {
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()

  const defaultEnabled = options?.enabled ?? true
  const { data, isLoading: isLoadingFDWs } = useFDWsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: defaultEnabled && !!bucketId,
      refetchInterval: (data) =>
        !!options?.refetchInterval ? options.refetchInterval(data) : false,
    }
  )

  const s3VectorsWrapper = useMemo(() => {
    return data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          { handlerName: WRAPPER_HANDLERS.S3_VECTORS, server: { options: [] } },
          wrapper
        )
      )
      .find((w) => w.name === getVectorBucketFDWName(bucketId ?? ''))
  }, [data, bucketId])

  const s3VectorsWrapperMeta = WRAPPERS.find((w) => w.handlerName === WRAPPER_HANDLERS.S3_VECTORS)

  return {
    data: s3VectorsWrapper,
    meta: s3VectorsWrapperMeta!,
    isLoading: isLoadingProject || isLoadingFDWs,
  }
}
