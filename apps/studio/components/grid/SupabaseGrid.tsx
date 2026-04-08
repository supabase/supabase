import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { PropsWithChildren, useRef } from 'react'
import { DataGridHandle } from 'react-data-grid'

import { useIsTableFilterBarEnabled } from '../interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Shortcuts } from './components/common/Shortcuts'
import { Footer } from './components/footer/Footer'
import { Grid } from './components/grid/Grid'
import { Header, HeaderProps } from './components/header/Header'
import { HeaderNew } from './components/header/HeaderNew'
import { useTableFilter } from './hooks/useTableFilter'
import { useTableSort } from './hooks/useTableSort'
import { validateMsSqlSorting } from './MsSqlValidation'
import { GridProps } from './types'
import { formatGridDataWithOperationValues } from './utils/queueOperationUtils'
import { isMsSqlForeignTable } from '@/data/table-editor/table-editor-types'
import { useTableRowsQuery } from '@/data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { RoleImpersonationState } from '@/lib/role-impersonation'
import { EMPTY_ARR } from '@/lib/void'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { QueuedOperation } from '@/state/table-editor-operation-queue.types'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

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
  const preflightCheck = !tableEditorSnap.tablesToIgnorePreflightCheck.includes(tableId ?? -1)

  const gridRef = useRef<DataGridHandle>(null)
  const newFilterBarEnabled = useIsTableFilterBarEnabled()

  const { filters } = useTableFilter()
  const { sorts, onApplySorts } = useTableSort()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const msSqlWarning = isMsSqlForeignTable(snap.originalTable)
    ? validateMsSqlSorting({ filters, sorts, table: snap.originalTable })
    : { warning: null }
  const tableQueriesEnabled = msSqlWarning.warning === null

  const {
    data,
    error,
    isSuccess,
    isError,
    isPending: isLoading,
    isRefetching,
  } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      tableId,
      sorts,
      filters,
      page: snap.page,
      preflightCheck,
      limit: tableEditorSnap.rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      placeholderData: keepPreviousData,
      enabled: tableQueriesEnabled,
      retry: (_, error: any) => {
        const doesNotExistError = error && error.message?.includes('does not exist')
        if (doesNotExistError) onApplySorts([])
        return false
      },
    }
  )

  const operations = (tableEditorSnap.operationQueue.operations as QueuedOperation[]).filter(
    (op) => op.tableId === tableId
  )
  const baseRows = data?.rows ?? EMPTY_ARR
  const rows = formatGridDataWithOperationValues({ operations, rows: baseRows })

  const HeaderComponent = newFilterBarEnabled ? HeaderNew : Header

  return (
    <div className="sb-grid h-full flex flex-col">
      <HeaderComponent
        customHeader={customHeader}
        isRefetching={isRefetching}
        tableQueriesEnabled={tableQueriesEnabled}
      />

      {msSqlWarning.warning !== null && <msSqlWarning.Component />}

      {children || (
        <>
          <Grid
            ref={gridRef}
            {...gridProps}
            rows={rows}
            error={error}
            isDisabled={!tableQueriesEnabled}
            isLoading={isLoading}
            isSuccess={isSuccess}
            isError={isError}
          />
          <Footer enableForeignRowsQuery={tableQueriesEnabled} />
          <Shortcuts gridRef={gridRef} rows={rows} />
        </>
      )}
    </div>
  )
}
