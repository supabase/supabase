import React, { useState, useMemo, useCallback } from 'react'
import { isEqual } from 'lodash'
import update from 'immutability-helper'
import { Button, IconList, IconChevronDown, Popover } from 'ui'
import { useUrlState } from 'hooks'

import SortRow from './SortRow'
import { DropdownControl } from 'components/grid/components/common'
import { Sort, SupaTable } from 'components/grid/types'
import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'

export interface SortPopoverProps {
  table: SupaTable
  sorts: string[]
  setParams: ReturnType<typeof useUrlState>[1]
}

const SortPopover = ({ table, sorts, setParams }: SortPopoverProps) => {
  const btnText =
    (sorts || []).length > 0
      ? `Sorted by ${sorts.length} rule${sorts.length > 1 ? 's' : ''}`
      : 'Sort'

  return (
    <Popover
      size="large"
      align="start"
      className="sb-grid-sort-popover"
      overlay={<SortOverlay table={table} sorts={sorts} setParams={setParams} />}
    >
      <Button
        asChild
        type={(sorts || []).length > 0 ? 'link' : 'text'}
        icon={
          <div className="text-scale-1000">
            <IconList strokeWidth={1.5} />
          </div>
        }
      >
        <span>{btnText}</span>
      </Button>
    </Popover>
  )
}

export default SortPopover

export interface SortOverlayProps extends SortPopoverProps {}

const SortOverlay = ({ table, sorts: sortsFromUrl, setParams }: SortOverlayProps) => {
  const initialSorts = useMemo(
    () => formatSortURLParams((sortsFromUrl as string[]) ?? []),
    [sortsFromUrl]
  )
  const [sorts, setSorts] = useState<Sort[]>(initialSorts)

  const columns = table.columns!.filter((x) => {
    const found = sorts.find((y) => y.column == x.name)
    return !found
  })

  const dropdownOptions =
    columns?.map((x) => {
      return { value: x.name, label: x.name }
    }) || []

  function onAddSort(columnName: string | number) {
    setSorts([...sorts, { column: columnName as string, ascending: true }])
  }

  function onApplySort() {
    setParams((prevParams) => {
      return {
        ...prevParams,
        sort: sorts.map((sort) => `${sort.column}:${sort.ascending ? 'asc' : 'desc'}`),
      }
    })
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
          <h5 className="text-sm text-scale-1100">No sorts applied to this view</h5>
          <p className="text-xs text-scale-900">Add a column below to sort the view</p>
        </div>
      )}

      <Popover.Separator />
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
              iconRight={<IconChevronDown />}
              className="sb-grid-dropdown__item-trigger"
            >
              <span>{`Pick ${sorts.length > 1 ? 'another' : 'a'} column to sort by`}</span>
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-sm text-scale-1100">All columns have been added</p>
        )}
        <Button disabled={isEqual(sorts, initialSorts)} type="default" onClick={onApplySort}>
          Apply sorting
        </Button>
      </div>
    </div>
  )
}
