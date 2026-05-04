import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { ChevronDown, Trash } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'

import { useInitializeFiltersFromUrl, useSyncFiltersToUrl } from '../../hooks/useFilterLifeCycle'
import { ExportDialog } from './ExportDialog'
import { FilterPopoverNew } from './filter/FilterPopoverNew'
import { formatRowsForCSV } from './Header.utils'
import { SortPopover } from './sort/SortPopover'
import { useTableRowOperations } from '@/components/grid/hooks/useTableRowOperations'
import { useTableSort } from '@/components/grid/hooks/useTableSort'
import { GridHeaderActions } from '@/components/interfaces/TableGridEditor/GridHeaderActions'
import { formatTableRowsToSQL } from '@/components/interfaces/TableGridEditor/TableEntity.utils'
import {
  useExportAllRowsAsCsv,
  useExportAllRowsAsJson,
  useExportAllRowsAsSql,
} from '@/components/layouts/TableEditorLayout/ExportAllRows'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import { useTableRowsCountQuery } from '@/data/table-rows/table-rows-count-query'
import { useTableRowsQuery } from '@/data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { RoleImpersonationState } from '@/lib/role-impersonation'
import {
  useRoleImpersonationStateSnapshot,
  useSubscribeToImpersonatedRole,
} from '@/state/role-impersonation-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export type HeaderProps = {
  customHeader: ReactNode
  isRefetching: boolean
  tableQueriesEnabled?: boolean
}

export const Header = ({ customHeader, isRefetching, tableQueriesEnabled = true }: HeaderProps) => {
  useInitializeFiltersFromUrl()

  useSyncFiltersToUrl()

  const snap = useTableEditorTableStateSnapshot()

  return (
    <div>
      <div className="flex flex-wrap min-h-10 items-center bg-dash-sidebar dark:bg-surface-100">
        {customHeader ? (
          <div className="flex-1 px-1.5">{customHeader}</div>
        ) : snap.selectedRows.size > 0 ? (
          <div className="flex-1 px-1.5">
            <RowHeader tableQueriesEnabled={tableQueriesEnabled} />
          </div>
        ) : (
          <div className="w-full flex items-center justify-between gap-2 pr-1.5 py-1.5 border-b border-border">
            <FilterPopoverNew isRefetching={isRefetching} />
          </div>
        )}
        <div className="flex items-center gap-2 overflow-x-auto px-1.5 py-1.5">
          {!customHeader && snap.selectedRows.size === 0 && (
            <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
          )}
          <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
        </div>
      </div>
    </div>
  )
}

type RowHeaderProps = {
  tableQueriesEnabled?: boolean
}

const RowHeader = ({ tableQueriesEnabled = true }: RowHeaderProps) => {
  const { id: _id } = useParams()
  const tableId = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { deleteRows } = useTableRowOperations()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const isImpersonatingRole = roleImpersonationState.role !== undefined

  const filters = snap.filters
  const { sorts } = useTableSort()

  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const preflightCheck = !tableEditorSnap.tablesToIgnorePreflightCheck.includes(tableId ?? -1)

  const { data } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      tableId: snap.table.id,
      sorts,
      filters,
      page: snap.page,
      preflightCheck,
      limit: tableEditorSnap.rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    { enabled: tableQueriesEnabled }
  )

  const { data: countData } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      tableId: snap.table.id,
      filters,
      enforceExactCount: snap.enforceExactCount,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    { placeholderData: keepPreviousData, enabled: tableQueriesEnabled }
  )

  const allRows = data?.rows ?? []
  const totalRows = countData?.count ?? 0

  const onSelectAllRows = () => {
    snap.setSelectedRows(new Set(allRows.map((row) => row.idx)), true)
  }

  const onToggleSelectAllInTable = () => {
    if (snap.allRowsSelected) {
      snap.setSelectedRows(new Set(), false)
    } else {
      onSelectAllRows()
    }
  }

  const onRowsDelete = () => {
    const rowIdxs = Array.from(snap.selectedRows) as number[]
    const rows = allRows.filter((x) => rowIdxs.includes(x.idx))

    deleteRows({
      rows,
      table: snap.originalTable,
      allRowsSelected: snap.allRowsSelected,
      totalRows,
      callback: () => {
        snap.resetSelectedRows()
      },
    })
  }

  const onCopyRows = (type: 'csv' | 'json' | 'sql') => {
    const rows = allRows.filter((x) => snap.selectedRows.has(x.idx))

    if (type === 'csv') {
      const csv = formatRowsForCSV({
        rows,
        columns: snap.table!.columns.map((column) => column.name),
      })
      copyToClipboard(csv)
    } else if (type === 'sql') {
      const sqlStatements = formatTableRowsToSQL(snap.table, rows)
      copyToClipboard(sqlStatements)
    } else if (type === 'json') {
      copyToClipboard(JSON.stringify(rows))
    }

    toast.success('Copied rows to clipboard')
  }

  const exportParams = snap.allRowsSelected
    ? ({ type: 'fetch_all', filters, sorts } as const)
    : ({
        type: 'provided_rows',
        table: snap.table,
        rows: allRows.filter((x) => snap.selectedRows.has(x.idx)),
      } as const)

  const { exportCsv, confirmationModal: exportCsvConfirmationModal } = useExportAllRowsAsCsv(
    project
      ? {
          enabled: true,
          projectRef: project.ref,
          connectionString: project?.connectionString ?? null,
          entity: snap.table,
          totalRows,
          ...exportParams,
        }
      : { enabled: false }
  )
  const onRowsExportCSV = async () => {
    setIsExporting(true)

    if (!project) {
      toast.error('Project is required')
      return setIsExporting(false)
    }

    exportCsv()

    setIsExporting(false)
  }

  const { exportSql, confirmationModal: exportSqlConfirmationModal } = useExportAllRowsAsSql(
    project
      ? {
          enabled: true,
          projectRef: project.ref,
          connectionString: project?.connectionString ?? null,
          entity: snap.table,
          ...exportParams,
        }
      : { enabled: false }
  )
  const onRowsExportSQL = async () => {
    setIsExporting(true)

    if (!project) {
      toast.error('Project is required')
      return setIsExporting(false)
    }

    exportSql()

    setIsExporting(false)
  }

  const { exportJson, confirmationModal: exportJsonConfirmationModal } = useExportAllRowsAsJson(
    project
      ? {
          enabled: true,
          projectRef: project.ref,
          connectionString: project?.connectionString ?? null,
          entity: snap.table,
          ...exportParams,
        }
      : { enabled: false }
  )
  const onRowsExportJSON = async () => {
    if (!project) {
      return toast.error('Project is required')
    }

    setIsExporting(true)

    exportJson()

    setIsExporting(false)
  }

  useSubscribeToImpersonatedRole(() => {
    if (snap.allRowsSelected || snap.selectedRows.size > 0) {
      snap.resetSelectedRows()
    }
  })

  return (
    <>
      <div className="flex items-center gap-x-2">
        {snap.editable && (
          <Shortcut
            id={SHORTCUT_IDS.TABLE_EDITOR_DELETE_SELECTED_ROWS}
            onTrigger={onRowsDelete}
            options={{
              registerInCommandMenu: true,
              enabled: !(snap.allRowsSelected && isImpersonatingRole),
            }}
          >
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={<Trash />}
              onClick={onRowsDelete}
              disabled={snap.allRowsSelected && isImpersonatingRole}
              tooltip={{
                content: {
                  side: 'bottom',
                  text:
                    snap.allRowsSelected && isImpersonatingRole
                      ? 'Table truncation is not supported when impersonating a role'
                      : undefined,
                },
              }}
            >
              {snap.allRowsSelected
                ? `Delete all rows in table`
                : snap.selectedRows.size > 1
                  ? `Delete ${snap.selectedRows.size} rows`
                  : `Delete ${snap.selectedRows.size} row`}
            </ButtonTooltip>
          </Shortcut>
        )}

        {!snap.allRowsSelected ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                size="tiny"
                iconRight={<ChevronDown />}
                loading={isExporting}
                disabled={isExporting}
              >
                Copy
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => onCopyRows('csv')}>Copy as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyRows('sql')}>Copy as SQL</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyRows('json')}>Copy as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <ButtonTooltip
            disabled
            type="default"
            tooltip={{
              content: {
                side: 'bottom',
                className: 'w-64 text-center',
                text: 'Copy to clipboard is not supported while all rows in the table are selected',
              },
            }}
          >
            Copy
          </ButtonTooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="tiny"
              iconRight={<ChevronDown />}
              loading={isExporting}
              disabled={isExporting}
            >
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={snap.allRowsSelected ? 'w-52' : 'w-40'}>
            <DropdownMenuItem onClick={onRowsExportCSV}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={onRowsExportSQL}>Export as SQL</DropdownMenuItem>
            {snap.allRowsSelected ? (
              <DropdownMenuItem className="group" onClick={() => setShowExportModal(true)}>
                <div>
                  <p className="group-hover:text-foreground">Export via CLI</p>
                  <p className="text-foreground-lighter">Recommended for large tables</p>
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onRowsExportJSON}>Export as JSON</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {snap.selectedRows.size > 0 && totalRows > allRows.length && (
          <>
            <div className="h-6 ml-0.5">
              <Separator orientation="vertical" />
            </div>
            <Shortcut
              id={SHORTCUT_IDS.TABLE_EDITOR_SELECT_ALL_IN_TABLE}
              onTrigger={onToggleSelectAllInTable}
              options={{ registerInCommandMenu: true }}
            >
              <Button type="text" onClick={onToggleSelectAllInTable}>
                {snap.allRowsSelected ? 'Deselect all rows in table' : 'Select all rows in table'}
              </Button>
            </Shortcut>
          </>
        )}
      </div>

      <ExportDialog
        table={snap.table}
        filters={filters}
        sorts={sorts}
        open={showExportModal}
        onOpenChange={() => setShowExportModal(false)}
      />

      {exportCsvConfirmationModal}
      {exportSqlConfirmationModal}
      {exportJsonConfirmationModal}
    </>
  )
}
