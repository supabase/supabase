import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useMemo, useCallback, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Sort } from 'components/grid/types'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import SortRow from './SortRow'
import { DropdownControl } from '../../common/DropdownControl'

export interface SortPopoverPrimitiveProps {
  buttonText?: string
  sorts: Sort[]
  onApplySorts: (sorts: Sort[]) => void
  portal?: boolean
  providedBackend?: any
}

const SortPopoverPrimitive = ({
  buttonText,
  sorts,
  onApplySorts,
  portal = true,
  providedBackend,
}: SortPopoverPrimitiveProps) => {
  const [open, setOpen] = useState(false)
  const snap = useTableEditorTableStateSnapshot()

  // Internal state management
  const [localSorts, setLocalSorts] = useState<Sort[]>(sorts)

  // Update local state when sorts prop changes
  useMemo(() => {
    setLocalSorts(sorts)
  }, [sorts])

  const displayButtonText =
    buttonText ??
    (sorts.length > 0 ? `Sorted by ${sorts.length} rule${sorts.length > 1 ? 's' : ''}` : 'Sort')

  const columns = useMemo(() => {
    if (!snap?.table?.columns) return []
    return snap.table.columns.filter((x) => {
      if (x.dataType === 'json' || x.dataType === 'jsonb') return false
      const found = localSorts.find((y) => y.column == x.name)
      return !found
    })
  }, [snap?.table?.columns, localSorts])

  const dropdownOptions = useMemo(() => {
    return columns?.map((x) => ({ value: x.name, label: x.name })) || []
  }, [columns])

  const onAddSort = (columnName: string | number) => {
    const currentTableName = snap.table?.name
    if (currentTableName) {
      setLocalSorts([
        ...localSorts,
        { table: currentTableName, column: columnName as string, ascending: true },
      ])
    }
  }

  const onDeleteSort = useCallback((column: string) => {
    setLocalSorts((currentSorts) => currentSorts.filter((sort) => sort.column !== column))
  }, [])

  const onToggleSort = useCallback((column: string, ascending: boolean) => {
    setLocalSorts((currentSorts) => {
      const index = currentSorts.findIndex((x) => x.column === column)
      if (index === -1) return currentSorts
      const updatedSort = { ...currentSorts[index], ascending }
      return [...currentSorts.slice(0, index), updatedSort, ...currentSorts.slice(index + 1)]
    })
  }, [])

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

  const content = (
    <div className="space-y-2 py-2">
      {localSorts.map((sort, index) => (
        <SortRow
          key={sort.column}
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
        <div className="flex items-center">
          <Button
            disabled={isEqual(localSorts, sorts)}
            type="default"
            onClick={() => onApplySorts(localSorts)}
          >
            Apply sorting
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={sorts.length > 0 ? 'link' : 'text'} icon={<List />}>
          {displayButtonText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        {providedBackend ? content : <DndProvider backend={HTML5Backend}>{content}</DndProvider>}
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default SortPopoverPrimitive
