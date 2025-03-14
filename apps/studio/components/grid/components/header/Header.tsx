import { PermissionAction } from '@supabase/shared-types/out/constants'
import saveAs from 'file-saver'
import { ArrowUp, ChevronDown, FileText, Trash } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'
import { ReactNode, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useTrackedState } from 'components/grid/store/Store'
import type { Filter, Sort, SupaTable } from 'components/grid/types'
import { formatTableRowsToSQL } from 'components/interfaces/TableGridEditor/TableEntity.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { fetchAllTableRows, useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useUrlState } from 'hooks/ui/useUrlState'
import {
  useRoleImpersonationStateSnapshot,
  useSubscribeToImpersonatedRole,
} from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'
import FilterPopover from './filter/FilterPopover'
import { SortPopover } from './sort'

// [Joshen] CSV exports require this guard as a fail-safe if the table is
// just too large for a browser to keep all the rows in memory before
// exporting. Either that or export as multiple CSV sheets with max n rows each
export const MAX_EXPORT_ROW_COUNT = 500000
export const MAX_EXPORT_ROW_COUNT_MESSAGE = (
  <>
    Sorry! We're unable to support exporting row counts larger than $
    {MAX_EXPORT_ROW_COUNT.toLocaleString()} at the moment. Alternatively, you may consider using
    <Link href="https://supabase.com/docs/reference/cli/supabase-db-dump" target="_blank">
      pg_dump
    </Link>{' '}
    via our CLI instead.
  </>
)

export type HeaderProps = {
  table: SupaTable
  sorts: Sort[]
  filters: Filter[]
  onAddColumn?: () => void
  onAddRow?: () => void
  onImportData?: () => void
  headerActions?: ReactNode
  customHeader: ReactNode
}

const Header = ({
  table,
  sorts,
  filters,
  onAddColumn,
  onAddRow,
  onImportData,
  headerActions,
  customHeader,
}: HeaderProps) => {
  const snap = useTableEditorTableStateSnapshot()

  return (
    <div>
      <div className="flex h-10 items-center justify-between bg-dash-sidebar px-1.5 py-1.5 gap-2 overflow-x-auto">
        {customHeader ? (
          <>{customHeader}</>
        ) : (
          <>
            {snap.selectedRows.size > 0 ? (
              <RowHeader table={table} sorts={sorts} filters={filters} />
            ) : (
              <DefaultHeader
                table={table}
                onAddColumn={onAddColumn}
                onAddRow={onAddRow}
                onImportData={onImportData}
              />
            )}
          </>
        )}
        <div className="sb-grid-header__inner">{headerActions}</div>
      </div>
    </div>
  )
}

export default Header

type DefaultHeaderProps = {
  table: SupaTable
  onAddColumn?: () => void
  onAddRow?: () => void
  onImportData?: () => void
}
const DefaultHeader = ({ table, onAddColumn, onAddRow, onImportData }: DefaultHeaderProps) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()

  const canAddNew = onAddRow !== undefined || onAddColumn !== undefined

  // [Joshen] Using this logic to block both column and row creation/update/delete
  const canCreateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  const [{ filter: filters, sort: sorts }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })

  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <FilterPopover table={table} filters={filters as string[]} setParams={setParams} />
        <SortPopover table={table} sorts={sorts as string[]} setParams={setParams} />
      </div>
      {canAddNew && (
        <>
          <div className="h-[20px] w-px border-r border-control" />
          <div className="flex items-center gap-2">
            {canCreateColumns && (
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
                <DropdownMenuContent side="bottom" align="start">
                  {[
                    ...(onAddRow !== undefined
                      ? [
                          <DropdownMenuItem
                            key="add-row"
                            className="group space-x-2"
                            onClick={onAddRow}
                          >
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
                              <p className="text-foreground-light">
                                Insert a new row into {table.name}
                              </p>
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
                                Insert a new column into {table.name}
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
                                  project: ref ?? 'Unknown',
                                  organization: org?.slug ?? 'Unknown',
                                },
                              })
                            }}
                          >
                            <div className="relative -mt-2">
                              <FileText
                                size={18}
                                strokeWidth={1.5}
                                className="-translate-x-[2px]"
                              />
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
            )}
          </div>
        </>
      )}
    </div>
  )
}

type RowHeaderProps = {
  table: SupaTable
  sorts: Sort[]
  filters: Filter[]
}
const RowHeader = ({ table, sorts, filters }: RowHeaderProps) => {
  const state = useTrackedState()

  const { project } = useProjectContext()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const isImpersonatingRole = roleImpersonationState.role !== undefined

  const [isExporting, setIsExporting] = useState(false)

  const { data } = useTableRowsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    tableId: table.id,
    sorts,
    filters,
    page: snap.page,
    limit: tableEditorSnap.rowsPerPage,
    impersonatedRole: roleImpersonationState.role,
  })

  const { data: countData } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: table.id,
      filters,
      enforceExactCount: snap.enforceExactCount,
      impersonatedRole: roleImpersonationState.role,
    },
    { keepPreviousData: true }
  )

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

  async function onRowsExportCSV() {
    setIsExporting(true)

    if (snap.allRowsSelected && totalRows > MAX_EXPORT_ROW_COUNT) {
      toast.error(
        <div className="prose text-sm text-foreground">{MAX_EXPORT_ROW_COUNT_MESSAGE}</div>
      )
      return setIsExporting(false)
    }

    if (!project) {
      toast.error('Project is required')
      return setIsExporting(false)
    }

    const rows = snap.allRowsSelected
      ? await fetchAllTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table,
          filters,
          sorts,
          impersonatedRole: roleImpersonationState.role,
        })
      : allRows.filter((x) => snap.selectedRows.has(x.idx))

    const formattedRows = rows.map((row) => {
      const formattedRow = row
      Object.keys(row).map((column) => {
        if (typeof row[column] === 'object' && row[column] !== null)
          formattedRow[column] = JSON.stringify(formattedRow[column])
      })
      return formattedRow
    })

    const csv = Papa.unparse(formattedRows, {
      columns: state.table!.columns.map((column) => column.name),
    })
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(csvData, `${state.table!.name}_rows.csv`)
    setIsExporting(false)
  }

  async function onRowsExportSQL() {
    setIsExporting(true)

    if (snap.allRowsSelected && totalRows > MAX_EXPORT_ROW_COUNT) {
      toast.error(
        <div className="prose text-sm text-foreground">{MAX_EXPORT_ROW_COUNT_MESSAGE}</div>
      )
      return setIsExporting(false)
    }

    if (!project) {
      toast.error('Project is required')
      return setIsExporting(false)
    }

    const rows = snap.allRowsSelected
      ? await fetchAllTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table,
          filters,
          sorts,
          impersonatedRole: roleImpersonationState.role,
        })
      : allRows.filter((x) => snap.selectedRows.has(x.idx))

    const sqlStatements = formatTableRowsToSQL(table, rows)
    const sqlData = new Blob([sqlStatements], { type: 'text/sql;charset=utf-8;' })
    saveAs(sqlData, `${state.table!.name}_rows.sql`)
    setIsExporting(false)
  }
  function deselectRows() {
    snap.setSelectedRows(new Set())
  }

  const allRows = data?.rows ?? []
  const totalRows = countData?.count ?? 0
  const { editable } = state

  useSubscribeToImpersonatedRole(() => {
    if (snap.allRowsSelected || snap.selectedRows.size > 0) {
      deselectRows()
    }
  })

  return (
    <div className="flex items-center gap-x-2">
      {editable && (
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
        <DropdownMenuContent className="w-40">
          <DropdownMenuItem onClick={onRowsExportCSV}>
            <span className="text-foreground-light">Export to CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRowsExportSQL}>Export to SQL</DropdownMenuItem>
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
  )
}
