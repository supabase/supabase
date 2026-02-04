import { PermissionAction } from '@supabase/shared-types/out/constants'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useTableFilterNew } from 'components/grid/hooks/useTableFilterNew'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import { GridHeaderActions } from 'components/interfaces/TableGridEditor/GridHeaderActions'
import { formatTableRowsToSQL } from 'components/interfaces/TableGridEditor/TableEntity.utils'
import {
  useExportAllRowsAsCsv,
  useExportAllRowsAsJson,
  useExportAllRowsAsSql,
} from 'components/layouts/TableEditorLayout/ExportAllRows'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { ArrowUp, ChevronDown, FileText, Trash } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { toast } from 'sonner'
import {
  useRoleImpersonationStateSnapshot,
  useSubscribeToImpersonatedRole,
} from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  cn,
  copyToClipboard,
} from 'ui'

import { useInitializeFiltersFromUrl, useSyncFiltersToUrl } from '../../hooks/useFilterLifeCycle'
import { ExportDialog } from './ExportDialog'
import { formatRowsForCSV } from './Header.utils'
import { FilterPopoverNew } from './filter/FilterPopoverNew'
import { SortPopover } from './sort/SortPopover'

export type HeaderProps = {
  customHeader: ReactNode
  isRefetching: boolean
  tableQueriesEnabled?: boolean
}

export const HeaderNew = ({
  customHeader,
  isRefetching,
  tableQueriesEnabled = true,
}: HeaderProps) => {
  useInitializeFiltersFromUrl()

  useSyncFiltersToUrl()

  const snap = useTableEditorTableStateSnapshot()
  const showInsertButton = snap.selectedRows.size === 0

  return (
    <div>
      <div className="flex h-10 items-center justify-between bg-dash-sidebar dark:bg-surface-100 px-1.5 py-1.5 gap-2 overflow-x-auto ">
        {customHeader ? (
          customHeader
        ) : snap.selectedRows.size > 0 ? (
          <RowHeader tableQueriesEnabled={tableQueriesEnabled} />
        ) : (
          <DefaultHeader tableQueriesEnabled={tableQueriesEnabled} />
        )}
        <div className="flex items-center gap-2">
          <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
          {showInsertButton && <InsertButton />}
        </div>
      </div>
    </div>
  )
}

const DefaultHeader = ({
  tableQueriesEnabled = true,
}: Pick<HeaderProps, 'tableQueriesEnabled'>) => {
  return (
    <>
      <div className="flex-1 min-w-0">
        <FilterPopoverNew />
      </div>
      <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
    </>
  )
}

const InsertButton = () => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const snap = useTableEditorTableStateSnapshot()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const { can: canCreateColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const { mutate: sendEvent } = useSendEventMutation()

  const onAddRow =
    snap.editable && (snap.table.columns ?? []).length > 0 ? tableEditorSnap.onAddRow : undefined
  const onAddColumn = snap.editable ? tableEditorSnap.onAddColumn : undefined
  const onImportData = snap.editable ? tableEditorSnap.onImportData : undefined

  const canAddNew = onAddRow !== undefined || onAddColumn !== undefined

  if (!canAddNew || !canCreateColumns) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="table-editor-insert-new-row"
          type="primary"
          size="tiny"
          icon={<ChevronDown strokeWidth={1.5} />}
        >
          Insert
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {[
          ...(onAddRow !== undefined
            ? [
                <DropdownMenuItem key="add-row" className="group space-x-2" onClick={onAddRow}>
                  <div className="-mt-2 pr-1.5">
                    <div className="border border-foreground-lighter w-[15px] h-[4px]" />
                    <div className="border border-foreground-lighter w-[15px] h-[4px] my-[2px]" />
                    <div
                      className={cn([
                        'border border-foreground-light w-[15px] h-[4px] translate-x-0.5',
                        'transition duration-200 group-data-[highlighted]:border-brand group-data-[highlighted]:translate-x-0',
                      ])}
                    />
                  </div>
                  <div>
                    <p>Insert row</p>
                    <p className="text-foreground-light">Insert a new row into {snap.table.name}</p>
                  </div>
                </DropdownMenuItem>,
              ]
            : []),
          ...(onAddColumn !== undefined
            ? [
                <DropdownMenuItem
                  key="add-column"
                  className="group space-x-2"
                  onClick={onAddColumn}
                >
                  <div className="flex -mt-2 pr-1.5">
                    <div className="border border-foreground-lighter w-[4px] h-[15px]" />
                    <div className="border border-foreground-lighter w-[4px] h-[15px] mx-[2px]" />
                    <div
                      className={cn([
                        'border border-foreground-light w-[4px] h-[15px] -translate-y-0.5',
                        'transition duration-200 group-data-[highlighted]:border-brand group-data-[highlighted]:translate-y-0',
                      ])}
                    />
                  </div>
                  <div>
                    <p>Insert column</p>
                    <p className="text-foreground-light">
                      Insert a new column into {snap.table.name}
                    </p>
                  </div>
                </DropdownMenuItem>,
              ]
            : []),
          ...(onImportData !== undefined
            ? [
                <DropdownMenuItem
                  key="import-data"
                  className="group space-x-2"
                  onClick={() => {
                    onImportData()
                    sendEvent({
                      action: 'import_data_button_clicked',
                      properties: { tableType: 'Existing Table' },
                      groups: {
                        project: projectRef ?? 'Unknown',
                        organization: org?.slug ?? 'Unknown',
                      },
                    })
                  }}
                >
                  <div className="relative -mt-2">
                    <FileText size={18} strokeWidth={1.5} className="-translate-x-[2px]" />
                    <ArrowUp
                      className={cn(
                        'transition duration-200 absolute bottom-0 right-0 translate-y-1 opacity-0 bg-brand-400 rounded-full',
                        'group-data-[highlighted]:translate-y-0 group-data-[highlighted]:text-brand group-data-[highlighted]:opacity-100'
                      )}
                      strokeWidth={3}
                      size={12}
                    />
                  </div>
                  <div>
                    <p>Import data from CSV</p>
                    <p className="text-foreground-light">Insert new rows from a CSV</p>
                  </div>
                </DropdownMenuItem>,
              ]
            : []),
        ]}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type RowHeaderProps = {
  tableQueriesEnabled?: boolean
}

const RowHeader = ({ tableQueriesEnabled = true }: RowHeaderProps) => {
  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const isImpersonatingRole = roleImpersonationState.role !== undefined

  const filters = snap.filters
  const { sorts } = useTableSort()

  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const { data } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: snap.table.id,
      sorts,
      filters,
      page: snap.page,
      limit: tableEditorSnap.rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    { enabled: tableQueriesEnabled }
  )

  const { data: countData } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
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

  const onRowsDelete = () => {
    const numRows = snap.allRowsSelected ? totalRows : snap.selectedRows.size
    const rowIdxs = Array.from(snap.selectedRows) as number[]
    const rows = allRows.filter((x) => rowIdxs.includes(x.idx))

    tableEditorSnap.onDeleteRows(rows, {
      allRowsSelected: snap.allRowsSelected,
      numRows,
      callback: () => {
        snap.setSelectedRows(new Set())
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

  function deselectRows() {
    snap.setSelectedRows(new Set())
  }

  useSubscribeToImpersonatedRole(() => {
    if (snap.allRowsSelected || snap.selectedRows.size > 0) {
      deselectRows()
    }
  })

  return (
    <>
      <div className="flex items-center gap-x-2">
        {snap.editable && (
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

        {!snap.allRowsSelected && totalRows > allRows.length && (
          <>
            <div className="h-6 ml-0.5">
              <Separator orientation="vertical" />
            </div>
            <Button type="text" onClick={() => onSelectAllRows()}>
              Select all rows in table
            </Button>
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
