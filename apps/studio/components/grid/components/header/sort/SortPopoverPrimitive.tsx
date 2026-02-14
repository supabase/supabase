import { THRESHOLD_COUNT } from '@supabase/pg-meta/src/query/table-row-query'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import type { Sort } from 'components/grid/types'
import { InlineLink } from 'components/ui/InlineLink'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type RoleImpersonationState,
  useRoleImpersonationStateSnapshot,
} from 'state/role-impersonation-state'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { DropdownControl } from '../../common/DropdownControl'
import SortRow from './SortRow'

export interface SortPopoverPrimitiveProps {
  buttonText?: string
  sorts: Sort[]
  onApplySorts: (sorts: Sort[]) => void
  defaultOpen?: boolean
  tableQueriesEnabled?: boolean
}

/**
 * SortPopoverPrimitive - A component for sorting table columns
 *
 * This component maintains a draft state of sorts while editing, then applies
 * them to the parent component when "Apply" is clicked.
 *
 * To avoid issues with drag-and-drop reconciliation, we use a special sync mechanism
 * that properly detects external vs. internal updates.
 */
export const SortPopoverPrimitive = ({
  buttonText,
  sorts,
  onApplySorts,
  defaultOpen = false,
  tableQueriesEnabled = true,
}: SortPopoverPrimitiveProps) => {
  const { ref } = useParams()
  const { filters } = useTableFilter()
  const { data: project } = useSelectedProjectQuery()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const snap = useTableEditorTableStateSnapshot()
  const tableName = snap.table?.name || ''
  const tableSchema = snap.table.schema || ''

  const [open, setOpen] = useState(defaultOpen)
  const [showWarning, setShowWarning] = useState(false)
  // Local state for draft sorts
  const [localSorts, setLocalSorts] = useState<Sort[]>(sorts)

  // Track the last props we received for comparison
  const lastSortsRef = useRef<Sort[]>(sorts)
  // Track if we're in the middle of applying our own changes
  const isApplyingRef = useRef(false)

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
  const isLargeTable = (countData?.count ?? 0) > THRESHOLD_COUNT

  // Fix: Use localSorts for button text, not sorts
  const displayButtonText =
    buttonText ??
    (localSorts.length > 0
      ? `Sorted by ${localSorts.length} rule${localSorts.length > 1 ? 's' : ''}`
      : 'Sort')

  // Filter available columns to exclude columns already in sorts
  const columns = useMemo(() => {
    if (!snap?.table?.columns) return []
    return snap.table.columns.filter((x) => {
      const found = localSorts.find((y) => y.column == x.name)
      return !found
    })
  }, [snap?.table?.columns, localSorts])

  // Format the columns for the dropdown
  const dropdownOptions = useMemo(() => {
    return (
      columns?.map((x) => ({
        value: x.name,
        label: x.name,
        postLabel: x.dataType,
        disabled: x.dataType === 'json' || x.dataType === 'jsonb',
        tooltip:
          x.dataType === 'json' || x.dataType === 'jsonb'
            ? 'Sorting on JSON-based columns is currently not supported'
            : '',
      })) || []
    )
  }, [columns])

  // Add a new sort
  const onAddSort = (columnName: string | number) => {
    const currentTableName = snap.table?.name
    if (currentTableName) {
      setLocalSorts([
        ...localSorts,
        { table: currentTableName, column: columnName as string, ascending: true },
      ])
    }
  }

  // Remove a sort by column name
  const onDeleteSort = useCallback((column: string) => {
    setLocalSorts((currentSorts) => currentSorts.filter((sort) => sort.column !== column))
  }, [])

  // Toggle ascending/descending for a column
  const onToggleSort = useCallback((column: string, ascending: boolean) => {
    setLocalSorts((currentSorts) => {
      const index = currentSorts.findIndex((x) => x.column === column)
      if (index === -1) return currentSorts
      const updatedSort = { ...currentSorts[index], ascending }
      return [...currentSorts.slice(0, index), updatedSort, ...currentSorts.slice(index + 1)]
    })
  }, [])

  // Handle drag-and-drop reordering
  const onDragSort = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalSorts((currentSort) => {
      if (
        dragIndex < 0 ||
        dragIndex >= currentSort.length ||
        hoverIndex < 0 ||
        hoverIndex >= currentSort.length
      ) {
        return currentSort
      }
      const itemToMove = currentSort[dragIndex]
      const remainingItems = [
        ...currentSort.slice(0, dragIndex),
        ...currentSort.slice(dragIndex + 1),
      ]
      return [
        ...remainingItems.slice(0, hoverIndex),
        itemToMove,
        ...remainingItems.slice(hoverIndex),
      ]
    })
  }, [])

  // Fix: Compare for meaningful changes (only column order and ascending)
  const hasChanges = useMemo(() => {
    if (localSorts.length !== sorts.length) return true

    // Compare each sort by relevant properties
    return localSorts.some((localSort, index) => {
      const propSort = sorts[index]
      return (
        !propSort ||
        localSort.column !== propSort.column ||
        localSort.ascending !== propSort.ascending
      )
    })
  }, [localSorts, sorts])

  // Apply the sorts to the parent component
  const onSelectApplySorts = () => {
    // Mark that we're applying our changes to prevent re-syncing
    isApplyingRef.current = true

    // Update our last sorts ref to the current local state
    lastSortsRef.current = [...localSorts]

    // Create deep copies to avoid reference issues
    const sortsCopy = localSorts.map((sort) => ({ ...sort }))

    // Apply the sorts
    onApplySorts(sortsCopy)
  }

  // Generate stable keys for SortRow components to avoid reconciliation issues
  const getSortRowKey = (sort: Sort, index: number) => {
    return `sort-${sort.table}-${sort.column}-${index}`
  }

  // Sync with props when they change, but in a smarter way
  useEffect(() => {
    // If we're in the middle of applying changes, don't sync from props
    if (isApplyingRef.current) {
      isApplyingRef.current = false
      return
    }

    // If the props changed unexpectedly (not due to our own actions)
    // then we should update our local state
    if (!isEqual(sorts, lastSortsRef.current)) {
      setLocalSorts(sorts)
      lastSortsRef.current = sorts
    }
  }, [sorts])

  return (
    <>
      <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button type={localSorts.length > 0 ? 'link' : 'text'} icon={<List />}>
            {displayButtonText}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start">
          <div className="space-y-2 py-2">
            {localSorts.map((sort, index) => (
              <SortRow
                key={getSortRowKey(sort, index)}
                index={index}
                columnName={sort.column}
                sort={sort}
                onDelete={onDeleteSort}
                onToggle={onToggleSort}
                onDrag={onDragSort}
              />
            ))}
            {localSorts.length === 0 && (
              <div className="space-y-1 px-3">
                <h5 className="text-xs text-foreground-light">No sorts applied to this view</h5>
                <p className="text-xs text-foreground-lighter">
                  Add a column below to sort the view
                </p>
              </div>
            )}

            <PopoverSeparator_Shadcn_ />
            <div className="px-3 flex flex-row justify-between">
              {dropdownOptions && dropdownOptions.length > 0 ? (
                <DropdownControl
                  options={dropdownOptions}
                  onSelect={onAddSort}
                  side="bottom"
                  align="start"
                >
                  <Button
                    asChild
                    type="dashed"
                    iconRight={<ChevronDown size="14" className="text-foreground-light" />}
                    className="sb-grid-dropdown__item-trigger"
                    data-testid="table-editor-pick-column-to-sort-button"
                  >
                    <span>Pick {localSorts.length > 1 ? 'another' : 'a'} column to sort by</span>
                  </Button>
                </DropdownControl>
              ) : (
                <p className="text-sm text-foreground-light">All columns have been added</p>
              )}
              <div className="flex items-center">
                <Button
                  disabled={!hasChanges}
                  type="default"
                  onClick={() => {
                    if (isLargeTable && localSorts.length > 0) {
                      // [Joshen] Note we're only checking PKs - unable to check indexes properly
                      // as we are not able to deterministically figure out which columns the indexes are applied to
                      const hasSortNotPK = localSorts.some(
                        (x) => !snap.table.columns.find((y) => x.column === y.name)?.isPrimaryKey
                      )
                      if (hasSortNotPK) return setShowWarning(true)
                    }

                    onSelectApplySorts()
                  }}
                >
                  Apply sorting
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>

      <ConfirmationModal
        size="medium"
        variant="warning"
        visible={showWarning}
        confirmLabel="Confirm"
        title="Sorting on a large table"
        onConfirm={() => {
          onSelectApplySorts()
          setShowWarning(false)
        }}
        onCancel={() => {
          setLocalSorts(sorts)
          setShowWarning(false)
        }}
        alert={{
          base: { variant: 'warning' },
          title: 'Be careful with sorting on unindexed columns',
          description:
            'This may adversely impact your database, in particular if your table has a large number of rows - use with caution.',
        }}
      >
        <p className="text-foreground-light text-sm">
          We highly recommend only sorting on columns which are{' '}
          <InlineLink
            href={`/project/${ref}/database/indexes?search=${tableName}&schema=${tableSchema}`}
          >
            indexed
          </InlineLink>
          , such as your primary key columns.
        </p>
      </ConfirmationModal>
    </>
  )
}
