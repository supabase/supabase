import update from 'immutability-helper'
import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { DropdownControl } from 'components/grid/components/common/DropdownControl'
import type { Sort, SupaTable } from 'components/grid/types'
import { useUrlState } from 'hooks/ui/useUrlState'
import {
  Button,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import SortRow from './SortRow'

export interface SortPopoverProps {
  table: SupaTable
  sorts: string[]
  setParams: ReturnType<typeof useUrlState>[1]
}

const SortPopover = ({ table, sorts, setParams }: SortPopoverProps) => {
  const [open, setOpen] = useState(false)

  const btnText =
    (sorts || []).length > 0
      ? `Sorted by ${sorts.length} rule${sorts.length > 1 ? 's' : ''}`
      : 'Sort'

  const onApplySorts = (appliedSorts: Sort[]) => {
    setParams((prevParams) => {
      return {
        ...prevParams,
        sort: appliedSorts.map((sort) => `${sort.column}:${sort.ascending ? 'asc' : 'desc'}`),
      }
    })
  }

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type={(sorts || []).length > 0 ? 'link' : 'text'} icon={<List />}>
          {btnText}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-96" side="bottom" align="start">
        <SortOverlay table={table} sorts={sorts} onApplySorts={onApplySorts} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default SortPopover

export interface SortOverlayProps {
  table: SupaTable
  sorts: string[]
  onApplySorts: (sorts: Sort[]) => void
}

const SortOverlay = ({ table, sorts: sortsFromUrl, onApplySorts }: SortOverlayProps) => {
  const initialSorts = useMemo(
    () => formatSortURLParams(table.name, sortsFromUrl ?? []),
    [table.name, sortsFromUrl]
  )
  const [sorts, setSorts] = useState<Sort[]>(initialSorts)

  const columns = table.columns!.filter((x) => {
    // exclude json/jsonb columns from sorting. Sorting by json fields in PG is only possible if you provide key from
    // the JSON object.
    if (x.dataType === 'json' || x.dataType === 'jsonb') {
      return false
    }
    const found = sorts.find((y) => y.column == x.name)
    return !found
  })

  const dropdownOptions =
    columns?.map((x) => {
      return { value: x.name, label: x.name }
    }) || []

  function onAddSort(columnName: string | number) {
    setSorts([...sorts, { table: table.name, column: columnName as string, ascending: true }])
  }

  const onDeleteSort = useCallback((column: string) => {
    setSorts((currentSorts) => currentSorts.filter((sort) => sort.column !== column))
  }, [])

  const onToggleSort = useCallback((column: string, ascending: boolean) => {
    setSorts((currentSorts) => {
      const idx = currentSorts.findIndex((x) => x.column === column)

      return update(currentSorts, {
        [idx]: {
          $merge: { ascending },
        },
      })
    })
  }, [])

  const onDragSort = useCallback((dragIndex: number, hoverIndex: number) => {
    setSorts((currentSort) =>
      update(currentSort, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, currentSort[dragIndex]],
        ],
      })
    )
  }, [])

  return (
    <div className="space-y-2 py-2">
      {sorts.map((sort, index) => (
        <SortRow
          key={sort.column}
          table={table}
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
  )
}
