import { snakeCase } from 'lodash'
import { useMemo } from 'react'

import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  getWrapperMetaForWrapper,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

export const useAnalyticsBucketWrapperInstance = (
  { bucketId }: { bucketId?: string },
  options?: { enabled?: boolean }
) => {
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()

  const defaultEnabled = options?.enabled ?? true
  const { data, isLoading: isLoadingFDWs } = useFDWsQuery(
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
      .find((w) => w.name === snakeCase(`${bucketId}_fdw`))
  }, [data, bucketId])

  const icebergWrapperMeta = getWrapperMetaForWrapper(icebergWrapper)

  return {
    data: icebergWrapper,
    meta: icebergWrapperMeta,
    isLoading: isLoadingProject || isLoadingFDWs,
  }
}
