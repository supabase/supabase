import { useMemo } from 'react'

import {
  WRAPPER_HANDLERS,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { wrapperMetaComparator } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getVectorBucketFDWName } from './VectorBuckets.utils'

export const useS3VectorsWrapperInstance = ({ bucketId }: { bucketId?: string }) => {
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const { data, isPending: isLoadingFDWs } = useFDWsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !!bucketId,
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
