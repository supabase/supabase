import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { isEqual } from 'lodash'
import { ChevronDown, List, Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { DropdownControl } from '../../common/DropdownControl'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Sort } from 'components/grid/types'
import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import SortRow from './SortRow'

export interface SortPopoverProps {
  portal?: boolean
}

const SortPopover = ({ portal = true }: SortPopoverProps) => {
  const [open, setOpen] = useState(false)
  const { urlSorts } = useTableSort()

  const btnText =
    (urlSorts || []).length > 0
      ? `Sorted by ${urlSorts.length} rule${urlSorts.length > 1 ? 's' : ''}`
      : 'Sort'

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={(urlSorts || []).length > 0 ? 'link' : 'text'} icon={<List />}>
          {btnText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start" portal={portal}>
        <SortOverlay />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default SortPopover

export interface SortOverlayProps {}

const SortOverlay = ({}: SortOverlayProps): JSX.Element => {
  const snap = useTableEditorTableStateSnapshot()
  const { urlSorts, onApplySorts } = useTableSort()

  const initialSorts = useMemo(() => {
    const tableName = snap?.table?.name || ''
    return tableName ? formatSortURLParams(tableName, urlSorts ?? []) : []
  }, [snap?.table?.name, urlSorts])

  const [sorts, setSorts] = useState<Sort[]>(initialSorts)

  useMemo(() => {
    setSorts(initialSorts)
  }, [initialSorts])

  const columns = useMemo(() => {
    if (!snap?.table?.columns) return []
    return snap.table.columns.filter((x) => {
      if (x.dataType === 'json' || x.dataType === 'jsonb') return false
      const found = sorts.find((y) => y.column == x.name)
      return !found
    })
  }, [snap?.table?.columns, sorts])

  const dropdownOptions = useMemo(() => {
    return columns?.map((x) => ({ value: x.name, label: x.name })) || []
  }, [columns])

  function onAddSort(columnName: string | number) {
    const currentTableName = snap.table?.name
    if (currentTableName) {
      setSorts([
        ...sorts,
        { table: currentTableName, column: columnName as string, ascending: true },
      ])
    }
  }

  const onDeleteSort = useCallback((column: string) => {
    setSorts((currentSorts) => currentSorts.filter((sort) => sort.column !== column))
  }, [])

  const onToggleSort = useCallback((column: string, ascending: boolean) => {
    setSorts((currentSorts) => {
      const index = currentSorts.findIndex((x) => x.column === column)
      if (index === -1) return currentSorts
      const updatedSort = { ...currentSorts[index], ascending }
      return [...currentSorts.slice(0, index), updatedSort, ...currentSorts.slice(index + 1)]
    })
  }, [])

  const onDragSort = useCallback((dragIndex: number, hoverIndex: number) => {
    setSorts((currentSort) => {
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-2 py-2">
        {sorts.map((sort, index) => (
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
        {sorts.length === 0 && (
          <div className="space-y-1 px-3">
            <h5 className="text-sm text-foreground-light">No sorts applied to this view</h5>
            <p className="text-xs text-foreground-lighter">Add a column below to sort the view</p>
          </div>
        )}

        <PopoverSeparator_Shadcn_ />
        <div className="px-3 flex flex-row justify-between">
          {columns && columns.length > 0 ? (
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
                <span>Pick {sorts.length > 1 ? 'another' : 'a'} column to sort by</span>
              </Button>
            </DropdownControl>
          ) : (
            <p className="text-sm text-foreground-light">All columns have been added</p>
          )}
          <div className="flex items-center">
            <Button
              disabled={isEqual(sorts, initialSorts)}
              type="default"
              onClick={() => onApplySorts(sorts)}
            >
              Apply sorting
            </Button>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}
