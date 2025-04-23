import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { DataGridHandle } from 'react-data-grid'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPortal } from 'react-dom'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useUrlState } from 'hooks/ui/useUrlState'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { EMPTY_ARR } from 'lib/void'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

import { Shortcuts } from './components/common/Shortcuts'
import Footer from './components/footer/Footer'
import { Grid } from './components/grid/Grid'
import Header, { HeaderProps } from './components/header/Header'
import { RowContextMenu } from './components/menu'
import { GridProps } from './types'

import { useTableFilter } from './hooks/useTableFilter'
import { useTableSort } from './hooks/useTableSort'
import { DataTableFilter } from 'components/data-table-filter-table-editor'
import { useTableAdapter } from './tableAdapter'

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
  const [_, setParams] = useUrlState({ arrayKeys: ['sort', 'filter'] })
  const gridRef = useRef<DataGridHandle>(null)
  const [mounted, setMounted] = useState(false)
  const { filters, onApplyFilters } = useTableFilter()
  const { sorts } = useTableSort()
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
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      keepPreviousData: true,
      retryDelay: (retryAttempt, error: any) => {
        if (error && error.message?.includes('does not exist')) {
          setParams((prevParams) => ({
            ...prevParams,
            ...{ sort: undefined },
          }))
        }
        if (retryAttempt > 3) {
          return Infinity
        }
        return 5000
      },
    }
  )

  const tableAdapter = useTableAdapter({
    snap,
    filters,
    onApplyFilters,
    tableData: data?.rows,
    sorts,
  })

  useEffect(() => {
    if (!mounted) setMounted(true)
  }, [])

  if (!project) {
    return null
  }

  const rows = data?.rows ?? EMPTY_ARR

  return (
    <DndProvider backend={HTML5Backend} context={window}>
      <div className="sb-grid h-full flex flex-col">
        {/* <div className="flex px-3 py-1">
          <DataTableFilter table={tableAdapter} />
        </div> */}
        <Header sorts={sorts} filters={filters} customHeader={customHeader} data={data} />
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
