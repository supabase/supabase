import { WRAPPER_HANDLERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { wrapperMetaComparator } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { snakeCase } from 'lodash'
import { useMemo } from 'react'

export const useAnalyticsBucketWrapperInstance = (id: string) => {
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()

  const { data, isLoading: isLoadingFDWs } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrapperInstance = useMemo(() => {
    return data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          {
            handlerName: WRAPPER_HANDLERS.ICEBERG,
            server: {
              options: [],
            },
          },
          wrapper
        )
      )
      .find((w) => w.name === snakeCase(`${id}_fdw`))
  }, [data, id])

  return { data: wrapperInstance, isLoading: isLoadingProject || isLoadingFDWs }
}
