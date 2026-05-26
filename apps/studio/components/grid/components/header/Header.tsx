import { keepPreviousData } from '@tanstack/react-query'
import { useBreakpoint, useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { Button, Separator } from 'ui'

import { useInitializeFiltersFromUrl, useSyncFiltersToUrl } from '../../hooks/useFilterLifeCycle'
import { AllRowsCopyExportActions } from './AllRowsCopyExportActions'
import { CopyExportRowsActions } from './CopyExportRowsActions'
import { FilterPopoverNew } from './filter/FilterPopoverNew'
import { SortPopover } from './sort/SortPopover'
import { useTableRowOperations } from '@/components/grid/hooks/useTableRowOperations'
import { useTableSort } from '@/components/grid/hooks/useTableSort'
import { GridHeaderActions } from '@/components/interfaces/TableGridEditor/GridHeaderActions'
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

  const isMobile = useBreakpoint('md')
  const snap = useTableEditorTableStateSnapshot()
  const [isInputFocus, setIsInputFocus] = useState(false)
  const filterContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isInputFocus) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element
      const withinFilter = filterContainerRef.current?.contains(target)
      const withinPortal = target?.closest?.('[data-radix-popper-content-wrapper]')
      if (!withinFilter && !withinPortal) {
        setIsInputFocus(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isInputFocus])

  return (
    <div className="flex flex-wrap md:min-h-10 items-center bg-dash-sidebar dark:bg-surface-100">
      {customHeader ? (
        <div className="flex-1 px-1.5">{customHeader}</div>
      ) : snap.selectedRows.size > 0 ? (
        <div className="flex-1 px-1.5">
          <RowHeader tableQueriesEnabled={tableQueriesEnabled} />
        </div>
      ) : (
        <div
          ref={filterContainerRef}
          className="w-full flex items-center justify-between gap-2 pr-1.5 border-b border-border md:border-none pt-1 md:pt-0"
        >
          <FilterPopoverNew
            isRefetching={isRefetching}
            onInputFocus={() => setIsInputFocus(true)}
            onInputBlur={() => setIsInputFocus(false)}
          />

          {!isMobile && (
            <AnimatePresence>
              {!isInputFocus && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 30,
                    mass: 0.4,
                  }}
                  className="hidden md:flex items-center gap-2 overflow-x-auto"
                >
                  <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
                  <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {isMobile && (
        <div className="flex items-center gap-2 overflow-x-auto px-1.5 py-1.5">
          <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
          <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
        </div>
      )}
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
  const projectActionsParam = project
    ? { ref: project.ref, connectionString: project.connectionString ?? null }
    : undefined

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

  useSubscribeToImpersonatedRole(() => {
    if (snap.allRowsSelected || snap.selectedRows.size > 0) {
      snap.resetSelectedRows()
    }
  })

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-2">
        {snap.allRowsSelected ? (
          <AllRowsCopyExportActions
            table={snap.table}
            filters={filters}
            sorts={sorts}
            totalRows={totalRows}
            project={projectActionsParam}
          />
        ) : (
          <CopyExportRowsActions
            rows={allRows.filter((x) => snap.selectedRows.has(x.idx))}
            table={snap.table}
            project={projectActionsParam}
          />
        )}

        {snap.selectedRows.size > 0 && totalRows > allRows.length && (
          <>
            <div className="h-6 ml-0.5">
              <Separator orientation="vertical" className="bg-border" />
            </div>
            <Shortcut
              id={SHORTCUT_IDS.TABLE_EDITOR_SELECT_ALL_IN_TABLE}
              onTrigger={onToggleSelectAllInTable}
              options={{ registerInCommandMenu: true }}
              side="bottom"
            >
              <Button type="text" onClick={onToggleSelectAllInTable}>
                {snap.allRowsSelected ? 'Deselect all rows in table' : 'Select all rows in table'}
              </Button>
            </Shortcut>
          </>
        )}
      </div>

      {snap.editable && (
        <Shortcut
          id={SHORTCUT_IDS.TABLE_EDITOR_DELETE_SELECTED_ROWS}
          onTrigger={onRowsDelete}
          side="bottom"
          options={{
            registerInCommandMenu: true,
            enabled: !(snap.allRowsSelected && isImpersonatingRole),
          }}
        >
          <ButtonTooltip
            type="danger"
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
    </div>
  )
}
