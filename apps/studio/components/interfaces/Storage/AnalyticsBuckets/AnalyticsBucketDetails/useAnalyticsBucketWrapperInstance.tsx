import { useMemo } from 'react'

import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  getWrapperMetaForWrapper,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getAnalyticsBucketFDWName } from './AnalyticsBucketDetails.utils'

export const useAnalyticsBucketWrapperInstance = (
  { bucketId }: { bucketId?: string },
  options?: { enabled?: boolean }
) => {
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()

  const defaultEnabled = options?.enabled ?? true
  const { data, isPending: isLoadingFDWs } = useFDWsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { enabled: defaultEnabled && !!bucketId }
  )

  const icebergWrapper = useMemo(() => {
    return data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          { handlerName: WRAPPER_HANDLERS.ICEBERG, server: { options: [] } },
          wrapper
        )
      )
      .find((w) => w.name === getAnalyticsBucketFDWName(bucketId ?? ''))
  }, [data, bucketId])

  const icebergWrapperMeta = getWrapperMetaForWrapper(icebergWrapper)

  return {
    data: icebergWrapper,
    meta: icebergWrapperMeta,
    isLoading: isLoadingProject || isLoadingFDWs || !bucketId,
  }
}
