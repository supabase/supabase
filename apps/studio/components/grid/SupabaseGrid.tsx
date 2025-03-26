import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import { DataGridHandle } from 'react-data-grid'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPortal } from 'react-dom'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useUrlState } from 'hooks/ui/useUrlState'
import { EMPTY_ARR } from 'lib/void'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  filtersToUrlParams,
  formatFilterURLParams,
  formatSortURLParams,
  saveTableEditorStateToLocalStorage,
} from './SupabaseGrid.utils'
import { Shortcuts } from './components/common/Shortcuts'
import Footer from './components/footer/Footer'
import { Grid } from './components/grid/Grid'
import Header, { HeaderProps } from './components/header/Header'
import { RowContextMenu } from './components/menu'
import { Filter, GridProps } from './types'

export const SupabaseGrid = ({
  customHeader,
  gridProps,
  children,
}: PropsWithChildren<
  Pick<HeaderProps, 'customHeader'> & {
    gridProps?: GridProps
  }
>) => {
  const { id: _id } = useParams()
  const tableId = _id ? Number(_id) : undefined

  const { project } = useProjectContext()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const gridRef = useRef<DataGridHandle>(null)
  const [mounted, setMounted] = useState(false)

  const [{ sort, filter }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })
  const sorts = formatSortURLParams(snap.table.name, sort as string[] | undefined)
  const filters = formatFilterURLParams(filter as string[])

  const onApplyFilters = useCallback(
    (appliedFilters: Filter[]) => {
      snap.setEnforceExactCount(false)
      // Reset page to 1 when filters change
      snap.setPage(1)

      const filters = filtersToUrlParams(appliedFilters)

      setParams((prevParams) => {
        return {
          ...prevParams,
          filter: filters,
        }
      })

      if (project?.ref) {
        saveTableEditorStateToLocalStorage({
          projectRef: project.ref,
          tableName: snap.table.name,
          schema: snap.table.schema,
          filters: filters,
        })
      }
    },
    [project?.ref, snap.table.name, snap.table.schema]
  )

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { data, error, isSuccess, isError, isLoading, isRefetching } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId,
      sorts,
      filters,
      page: snap.page,
      limit: tableEditorSnap.rowsPerPage,
      impersonatedRole: roleImpersonationState.role,
    },
    {
      keepPreviousData: true,
      retryDelay: (retryAttempt, error: any) => {
        if (error && error.message?.includes('does not exist')) {
          setParams((prevParams) => {
            return {
              ...prevParams,
              ...{ sort: undefined },
            }
          })
        }
        if (retryAttempt > 3) {
          return Infinity
        }
        return 5000
      },
    }
  )

  useEffect(() => {
    if (!mounted) setMounted(true)
  }, [])

  const rows = data?.rows ?? EMPTY_ARR

  return (
    <DndProvider backend={HTML5Backend} context={window}>
      <div className="sb-grid h-full flex flex-col">
        <Header sorts={sorts} filters={filters} customHeader={customHeader} />

        {children || (
          <>
            <Grid
              ref={gridRef}
              {...gridProps}
              rows={rows}
              error={error}
              isLoading={isLoading}
              isSuccess={isSuccess}
              isError={isError}
              filters={filters}
              onApplyFilters={onApplyFilters}
            />
            <Footer isRefetching={isRefetching} />
            <Shortcuts gridRef={gridRef} rows={rows} />
          </>
        )}

        {mounted && createPortal(<RowContextMenu rows={rows} />, document.body)}
      </div>
    </DndProvider>
  )
}
