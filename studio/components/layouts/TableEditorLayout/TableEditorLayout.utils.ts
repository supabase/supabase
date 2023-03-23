import { SupaTable } from 'components/grid'
import { formatFilterURLParams, formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsPrefetch as _useTableRowsPrefetch } from 'data/table-rows/table-rows-query'
import { useUrlState } from 'hooks'
import { useCallback } from 'react'

/**
 * useTableRowsPrefetchWrapper is a wrapper around the base useTableRowsPrefetch that prefills the sort and filter params
 */
function useTableRowsPrefetchWrapper() {
  const [{ sort, filter }] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })
  const sorts = formatSortURLParams(sort as string[])
  const filters = formatFilterURLParams(filter as string[])

  const { project } = useProjectContext()
  const prefetch = _useTableRowsPrefetch()

  return useCallback(
    (table: SupaTable) =>
      prefetch({
        queryKey: [table.schema, table.name],
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        table,
        sorts,
        filters,
        page: 1,
        limit: 100,
      }),
    [project, sorts, filters]
  )
}

export default useTableRowsPrefetchWrapper
