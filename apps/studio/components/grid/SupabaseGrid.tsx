import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { DataGridHandle } from 'react-data-grid'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { createPortal } from 'react-dom'

import { useParams } from 'common'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { EMPTY_ARR } from 'lib/void'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

import { Shortcuts } from './components/common/Shortcuts'
import { Footer } from './components/footer/Footer'
import { Grid } from './components/grid/Grid'
import { Header, HeaderProps } from './components/header/Header'
import { RowContextMenu } from './components/menu'
import { GridProps } from './types'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableFilter } from './hooks/useTableFilter'
import { useTableSort } from './hooks/useTableSort'

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

  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const gridRef = useRef<DataGridHandle>(null)
  const [mounted, setMounted] = useState(false)

  const { filters, onApplyFilters } = useTableFilter()
  const { sorts, onApplySorts } = useTableSort()

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
      retry: (_, error: any) => {
        const doesNotExistError = error && error.message?.includes('does not exist')
        if (doesNotExistError) onApplySorts([])
        return false
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
        <Header customHeader={customHeader} isRefetching={isRefetching} />

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
            <Footer />
            <Shortcuts gridRef={gridRef} rows={rows} />
          </>
        )}

        {mounted && createPortal(<RowContextMenu rows={rows} />, document.body)}
      </div>
    </DndProvider>
  )
}
