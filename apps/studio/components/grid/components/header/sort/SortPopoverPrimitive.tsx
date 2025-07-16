import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Sort } from 'components/grid/types'
import useLatest from 'hooks/misc/useLatest'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { DropdownControl } from '../../common/DropdownControl'
import SortRow from './SortRow'

export interface SortPopoverPrimitiveProps {
  buttonText?: string
  sorts: Sort[]
  onApplySorts: (sorts: Sort[]) => void
  portal?: boolean
}

/**
 * SortPopoverPrimitive - A component for sorting table columns
 *
 * This component maintains a draft state of sorts that are automatically applied
 * with debouncing as changes are made.
 */
export const SortPopoverPrimitive = ({
  buttonText,
  sorts,
  onApplySorts,
  portal = true,
}: SortPopoverPrimitiveProps) => {
  const [open, setOpen] = useState(false)
  const snap = useTableEditorTableStateSnapshot()

  const [localSorts, setLocalSorts] = useState(sorts)

  const debouncedSorts = useDebounce(localSorts, 500)
  const onApplySortsRef = useLatest(onApplySorts)
  useEffect(() => {
    onApplySortsRef.current(debouncedSorts)
  }, [debouncedSorts, onApplySortsRef])

  // Display button text based on local state
  const displayButtonText =
    buttonText ??
    (localSorts.length > 0
      ? `Sorted by ${localSorts.length} rule${localSorts.length > 1 ? 's' : ''}`
      : 'Sort')

  // Filter available columns to exclude columns already in sorts
  const columns = useMemo(() => {
    if (!snap?.table?.columns) return []
    return snap.table.columns.filter((x) => {
      if (x.dataType === 'json' || x.dataType === 'jsonb') return false
      const found = localSorts.find((y) => y.column == x.name)
      return !found
    })
  }, [snap?.table?.columns, localSorts])

  // Format the columns for the dropdown
  const dropdownOptions = useMemo(() => {
    return columns?.map((x) => ({ value: x.name, label: x.name })) || []
  }, [columns])

  // Add a new sort
  const onAddSort = (columnName: string | number) => {
    const currentTableName = snap.table?.name
    if (currentTableName) {
      const newSorts: Sort[] = [
        ...localSorts,
        { table: currentTableName, column: columnName as string, ascending: true },
      ]
      setLocalSorts(newSorts)
    }
  }

  // Remove a sort by column name
  const onDeleteSort = useCallback(
    (column: string) => {
      const newSorts = localSorts.filter((sort) => sort.column !== column)
      setLocalSorts(newSorts)
    },
    [localSorts, setLocalSorts]
  )

  // Toggle ascending/descending for a column
  const onToggleSort = useCallback(
    (column: string, ascending: boolean) => {
      const index = localSorts.findIndex((x) => x.column === column)
      if (index === -1) return

      const updatedSort = { ...localSorts[index], ascending }
      const newSorts: Sort[] = [
        ...localSorts.slice(0, index),
        updatedSort,
        ...localSorts.slice(index + 1),
      ]

      setLocalSorts(newSorts)
    },
    [localSorts, setLocalSorts]
  )

  // Handle drag-and-drop reordering
  const onDragSort = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (
        dragIndex < 0 ||
        dragIndex >= localSorts.length ||
        hoverIndex < 0 ||
        hoverIndex >= localSorts.length
      ) {
        return
      }

      const itemToMove = localSorts[dragIndex]
      const remainingItems = [...localSorts.slice(0, dragIndex), ...localSorts.slice(dragIndex + 1)]

      const newSorts: Sort[] = [
        ...remainingItems.slice(0, hoverIndex),
        itemToMove,
        ...remainingItems.slice(hoverIndex),
      ]

      setLocalSorts(newSorts)
    },
    [localSorts, setLocalSorts]
  )

  // Generate stable keys for SortRow components to avoid reconciliation issues
  const getSortRowKey = (sort: Sort, index: number) => {
    return `sort-${sort.table}-${sort.column}-${index}`
  }

  const content = (
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
          <h5 className="text-sm text-foreground-light">No sorts applied to this view</h5>
          <p className="text-xs text-foreground-lighter">Add a column below to sort the view</p>
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
              type="text"
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
      </div>
    </div>
  )

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={localSorts.length > 0 ? 'link' : 'text'} icon={<List />}>
          {displayButtonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        {content}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
