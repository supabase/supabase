import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import type { Sort } from 'components/grid/types'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { DropdownControl } from 'components/grid/components/common/DropdownControl'
import QueryPerformanceSortRow from './QueryPerformanceSortRow'

// Define available columns for query performance sorting
const QUERY_PERFORMANCE_COLUMNS = [
  { name: 'query', dataType: 'text' },
  { name: 'rolname', dataType: 'text' },
  { name: 'total_time', dataType: 'numeric' },
  { name: 'prop_total_time', dataType: 'numeric' },
  { name: 'calls', dataType: 'numeric' },
  { name: 'avg_rows', dataType: 'numeric' },
  { name: 'max_time', dataType: 'numeric' },
  { name: 'mean_time', dataType: 'numeric' },
  { name: 'min_time', dataType: 'numeric' },
]

export interface QueryPerformanceSortPopoverProps {
  buttonText?: string
  sorts: Sort[]
  onApplySorts: (sorts: Sort[]) => void
  portal?: boolean
}

export const QueryPerformanceSortPopover = ({
  buttonText,
  sorts,
  onApplySorts,
  portal = true,
}: QueryPerformanceSortPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [localSorts, setLocalSorts] = useState<Sort[]>(sorts)

  // Track the last props we received for comparison
  const lastSortsRef = useRef<Sort[]>(sorts)
  const isApplyingRef = useRef(false)

  // Sync with props when they change
  useEffect(() => {
    if (isApplyingRef.current) {
      isApplyingRef.current = false
      return
    }

    if (!isEqual(sorts, lastSortsRef.current)) {
      setLocalSorts(sorts)
      lastSortsRef.current = sorts
    }
  }, [sorts])

  const displayButtonText =
    buttonText ??
    (localSorts.length > 0
      ? `Sorted by ${localSorts.length} rule${localSorts.length > 1 ? 's' : ''}`
      : 'Sort')

  console.log(displayButtonText)

  const columns = useMemo(() => {
    return QUERY_PERFORMANCE_COLUMNS.filter((x) => {
      if (x.dataType === 'json' || x.dataType === 'jsonb') return false
      const found = localSorts.find((y) => y.column === x.name)
      return !found
    })
  }, [localSorts])

  const dropdownOptions = useMemo(() => {
    return columns.map((x) => ({ value: x.name, label: x.name }))
  }, [columns])

  const onAddSort = (columnName: string | number) => {
    setLocalSorts([
      ...localSorts,
      { table: 'query_performance', column: columnName as string, ascending: true },
    ])
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

  const hasChanges = useMemo(() => {
    if (localSorts.length !== sorts.length) return true

    return localSorts.some((localSort, index) => {
      const propSort = sorts[index]
      return (
        !propSort ||
        localSort.column !== propSort.column ||
        localSort.ascending !== propSort.ascending
      )
    })
  }, [localSorts, sorts])

  const onSelectApplySorts = () => {
    isApplyingRef.current = true
    lastSortsRef.current = [...localSorts]
    const sortsCopy = localSorts.map((sort) => ({ ...sort }))
    onApplySorts(sortsCopy)
  }

  const getSortRowKey = (sort: Sort, index: number) => {
    return `sort-${sort.table}-${sort.column}-${index}`
  }

  const content = (
    <div className="space-y-2 py-2">
      {localSorts.map((sort, index) => (
        <QueryPerformanceSortRow
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
          <h5 className="text-foreground-light">No sorts applied to this view</h5>
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
            >
              <span>Pick {localSorts.length > 1 ? 'another' : 'a'} column to sort by</span>
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-sm text-foreground-light">All columns have been added</p>
        )}
        <div className="flex items-center">
          <Button disabled={!hasChanges} type="default" onClick={onSelectApplySorts}>
            Apply sorting
          </Button>
        </div>
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
        <DndProvider backend={HTML5Backend} context={window}>
          {content}
        </DndProvider>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
