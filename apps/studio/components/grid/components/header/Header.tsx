import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import saveAs from 'file-saver'
import { ArrowUp, ChevronDown, Download, FileText, Trash, X } from 'lucide-react'
import Papa from 'papaparse'
import { ReactNode, useState } from 'react'
import toast from 'react-hot-toast'

import { useDispatch, useTrackedState } from 'components/grid/store/Store'
import type { Filter, Sort, SupaTable } from 'components/grid/types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { fetchAllTableRows, useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useUrlState } from 'hooks/ui/useUrlState'
import {
  useRoleImpersonationStateSnapshot,
  useSubscribeToImpersonatedRole,
} from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import FilterPopover from './filter/FilterPopover'
import { SortPopover } from './sort'

// [Joshen] CSV exports require this guard as a fail-safe if the table is
// just too large for a browser to keep all the rows in memory before
// exporting. Either that or export as multiple CSV sheets with max n rows each
const MAX_EXPORT_ROW_COUNT = 500000

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
  const state = useTrackedState()
  const { selectedRows } = state

  return (
    <div>
      <div className="flex h-10 items-center justify-between bg-dash-sidebar px-5 py-1.5">
        {customHeader ? (
          <>{customHeader}</>
        ) : (
          <>
            {selectedRows.size > 0 ? (
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
  const canAddNew = onAddRow !== undefined || onAddColumn !== undefined

  // [Joshen] Using this logic to block both column and row creation/update/delete
  const canCreateColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')

  const [{ filter: filters, sort: sorts }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <FilterPopover table={table} filters={filters as string[]} setParams={setParams} />
        <SortPopover table={table} sorts={sorts as string[]} setParams={setParams} />
      </div>
      {canAddNew && (
        <>
          <div className="h-[20px] w-px border-r border-control"></div>
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
                            onClick={onImportData}
                          >
                            <div className="relative -mt-2">
                              <FileText
                                size={18}
                                strokeWidth={1.5}
                                className="-translate-x-[2px]"
                              />
                              <ArrowUp
                                className={clsx(
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
  const dispatch = useDispatch()

  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const isImpersonatingRole = roleImpersonationState.role !== undefined

  const [isExporting, setIsExporting] = useState(false)

  const { data } = useTableRowsQuery({
    queryKey: [table.schema, table.name],
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    table,
    sorts,
    filters,
    page: snap.page,
    limit: snap.rowsPerPage,
    impersonatedRole: roleImpersonationState.role,
  })

  const { data: countData } = useTableRowsCountQuery(
    {
      queryKey: [table?.schema, table?.name, 'count-estimate'],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table,
      filters,
      impersonatedRole: roleImpersonationState.role,
    },
    { keepPreviousData: true }
  )

  const onSelectAllRows = () => {
    dispatch({
      type: 'SELECT_ALL_ROWS',
      payload: { selectedRows: new Set(allRows.map((row) => row.idx)) },
    })
  }

  const onRowsDelete = () => {
    const numRows = allRowsSelected ? totalRows : selectedRows.size
    const rowIdxs = Array.from(selectedRows) as number[]
    const rows = allRows.filter((x) => rowIdxs.includes(x.idx))

    snap.onDeleteRows(rows, {
      allRowsSelected,
      numRows,
      callback: () => {
        dispatch({ type: 'REMOVE_ROWS', payload: { rowIdxs } })
        dispatch({
          type: 'SELECTED_ROWS_CHANGE',
          payload: { selectedRows: new Set() },
        })
      },
    })
  }

  async function onRowsExportCSV() {
    setIsExporting(true)

    if (allRowsSelected && totalRows > MAX_EXPORT_ROW_COUNT) {
      toast.error(
        `Sorry! We're unable to support exporting of CSV for row counts larger than ${MAX_EXPORT_ROW_COUNT.toLocaleString()} at the moment.`
      )
      return setIsExporting(false)
    }

    if (!project) {
      toast.error('Project is required')
      return setIsExporting(false)
    }

    const rows = allRowsSelected
      ? await fetchAllTableRows({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table,
          filters,
          sorts,
          impersonatedRole: roleImpersonationState.role,
        })
      : allRows.filter((x) => selectedRows.has(x.idx))

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

  function deselectRows() {
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    })
  }

  const allRows = data?.rows ?? []
  const totalRows = countData?.count ?? 0
  const { selectedRows, editable, allRowsSelected } = state

  useSubscribeToImpersonatedRole(() => {
    if (allRowsSelected || selectedRows.size > 0) {
      deselectRows()
    }
  })

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <Button type="default" className="px-1" icon={<X />} onClick={deselectRows} />
        <span className="text-xs text-foreground">
          {allRowsSelected
            ? `All rows in table selected`
            : selectedRows.size > 1
              ? `${selectedRows.size} rows selected`
              : `${selectedRows.size} row selected`}
        </span>
        {!allRowsSelected && totalRows > allRows.length && (
          <Button type="link" onClick={() => onSelectAllRows()}>
            Select all rows in table
          </Button>
        )}
      </div>
      <div className="h-[20px] border-r border-strong" />
      <div className="flex items-center gap-2">
        <Button
          type="primary"
          size="tiny"
          icon={<Download />}
          loading={isExporting}
          disabled={isExporting}
          onClick={onRowsExportCSV}
        >
          Export to CSV
        </Button>
        {editable && (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <Button
                type="default"
                size="tiny"
                icon={<Trash />}
                onClick={onRowsDelete}
                disabled={allRowsSelected && isImpersonatingRole}
              >
                {allRowsSelected
                  ? `Delete all rows in table`
                  : selectedRows.size > 1
                    ? `Delete ${selectedRows.size} rows`
                    : `Delete ${selectedRows.size} row`}
              </Button>
            </Tooltip.Trigger>

            {allRowsSelected && isImpersonatingRole && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      Table truncation is not supported when impersonating a role
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        )}
      </div>
    </div>
  )
}
